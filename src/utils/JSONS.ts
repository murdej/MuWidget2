import {StrParser} from "mu-js-utils/lib/StrParser";

export class JSONS {
    public static parse(src: string): any {
        const par = new JSONS();
        par.tokenize(src);
        return par.parseCollection();
    }

    constructor() {
    }

    protected chunkToType: Record<string, JSONSTokenType> = {
        ":": "colon",
        ",": "comma",
        "\n": "newLine",
        "{": "oOpen",
        "}": "oClose",
        "[": "aOpen",
        "]": "aClose",
    }

    protected specValues: Record<string, any> = {
        'null': null,
        'true': true,
        'false': false,
        'undefined': undefined,
    }

    protected stringTermChunks = [ ...Object.keys(this.chunkToType), "\\", "#", "/*" ];

    tokenize(src: string): JSONSToken[] {
        const res: JSONSToken[] = [];
        src = src.replace(/\r\n/g, "\n");
        const sp = new StrParser(src);
        // sp.debugMode = true;
        let lastPos = 0;
        while (!sp.isEnd()) {
            sp.skipChunks([" ", "\t"]);

            if (sp.startsWith(['#', '//'], true))
            { // line comment
                sp.findNext("\n", true);
            }
            else if (sp.startsWith('/*', true))
            { // block comment
                let d = 1;
                while(d) {
                    const ch = sp.findNext(['/*', '*/'], true);
                    if (!ch) throw new JSONSError('Incomplete block comment'); // EXC uncosed comment
                    if (ch.chunk === '/*') d++;
                    else d--;
                }
            }
            else if (sp.startsWith(Object.keys(this.chunkToType), true))
            { // control chars
                const t = this.chunkToType[sp.lastMark.chunk];
                if (t !== "newLine")
                    res.push({
                        type: t,
                        value: null,
                        pos: sp.lastMark.position,
                    });
            } else if (sp.startsWith(["'", '"'], true))
            { // enclosed string
                const q = sp.lastMark.chunk;
                const strBegin = sp.position;
                sp.savePos('stringBegin');
                let str = "";
                let strEnd = false;
                while (!strEnd) {
                    if (sp.findNext(['\\"', "\\'", q])) {
                        const strPart = sp.substring('stringBegin', '.');
                        // console.log(['++', strPart, str]);
                        str += strPart;
                        sp.toEndChunk();
                        sp.savePos('stringBegin');
                        // console.log('Str chunk: ' + sp.lastMark.chunk);
                        switch (sp.lastMark.chunk) {
                            case '\\"':
                                str += "\\\"";
                                break;
                            case "\\'":
                                str += "'";
                                break;
                            default:
                                strEnd = true;
                                break;
                        }
                    } else throw new JSONSError('missing the right quotation mark'); // EXC unclosed quote
                }
                let i=0;
                str = str.replace(/\n/g, "\\n");
                // console.log(["JSSTR [" + str + "]", ...[...str].map(c=>(i++) + ": " + c)]);
                res.push({
                    type: "value",
                    value: JSON.parse('"' + str + '"'),
                    pos: strBegin,
                });
            }
            else
            { // unenclosed string
                sp.savePos('stringBegin');
                const ch = sp.findNext(this.stringTermChunks, false);
                const valStr = sp.substring(
                    'stringBegin',
                    ch ? '.' : '>'
                ).trim();
                const valStrL = valStr.toLowerCase();
                res.push({
                    type: "value",
                    value: Object.keys(this.specValues).includes(valStrL)
                        ? this.specValues[valStrL]
                        // @ts-ignore
                        : (!isNaN(valStr)
                            ? parseFloat(valStr)
                            : valStr
                        ),
                    pos: sp.loadPos('stringBegin'),
                });
                if (!ch) break;
            }
            if (lastPos === sp.position) {
                // console.log(["Zacyklilo se.", ...res]);
                throw Error('The parsing is looping. Please create an issue and attach the source text for parsing. https://github.com/murdej/MuWidget2/issues');
            }
            lastPos = sp.position;
        }
        this.tokens = res;

        return res;
    }

    protected tokens: JSONSToken[] = [];

    protected tokenI: number = 0;

    protected collectionDeep: number = 0;

    protected curToken(shift: number = 0): JSONSToken|null
    {
        return this.tokens[this.tokenI + shift] ?? null;
    }

    protected nextToken(): JSONSToken|null
    {
        this.tokenI++;
        return this.tokens[this.tokenI] ?? null;
    }


    parseCollection(): any
    {
        let type: "array"|"object";
        const t = this.curToken();
        if (t.type === "aOpen") {
            type = "array";
            this.nextToken();
        }
        else if (t.type === "oOpen") {
            type = "object";
            this.nextToken();
        }
        else if (t.type === "value") { // autodetect
            const nt = this.curToken(1);
            if (nt === null) return t.value;
            type = nt.type === "colon" ? "object" : "array";
        }

        if (type === "object") {
            const res = {};
            while (this.curToken()) {
                let ct = this.curToken();
                // end of collection
                if (ct.type === "oClose") {
                    // this.nextToken();
                    return res;
                }
                // key : ....
                if (ct.type === "value") {
                    const key = ct.value;
                    ct = this.nextToken();
                    // collon
                    if (ct.type !== "colon") throw new JSONSError("Expected ':' ", ct);
                    ct = this.nextToken();
                    switch (ct.type) {
                        case "value":
                            res[key] = ct.value;
                            break;
                        case "aOpen":
                        case "oOpen":
                            res[key] = this.parseCollection();
                            break;
                        default:
                            throw new JSONSError("Expected value or [ or { or }", ct);
                    }
                    // optional comma
                    ct = this.nextToken();
                    if (ct && ct.type === "comma")
                        this.nextToken();
                } else throw new JSONSError("Expected property name ", ct);
            }
            return res;
        } else {
            const res = [];
            while (this.curToken()) {
                let ct = this.curToken();
                // end of collection
                if (ct.type === "aClose") {
                    // this.nextToken();
                    return res;
                }
                switch (ct.type) {
                    case "value":
                        res.push(ct.value);
                        break;
                    case "aOpen":
                    case "oOpen":
                        res.push(this.parseCollection());
                        break;
                    default:
                        throw new JSONSError("Expected value or [ or { or }", ct);
                }

                // optional comma
                ct = this.nextToken();
                if (ct && ct.type === "comma")
                    this.nextToken();
            }
            return res;
        }
    }
}

type JSONSToken = {
    type: JSONSTokenType,
    value: string|null,
    pos: number,
}

type JSONSTokenType = "value"|"colon"|"comma"|"aOpen"|"aClose"|"oOpen"|"oClose"|"newLine";

export class JSONSError extends Error {
    constructor(message: string, token: JSONSToken|null = null) {
        super(message + (token
            ? " position: " + token.pos + " [" + token.type + ( token.type === "value" ? ": " + JSON.stringify(token.value) + ']' : '')
            : "")
        );
        this.name = "JSONSError";
        // this.token = token;
    }
}