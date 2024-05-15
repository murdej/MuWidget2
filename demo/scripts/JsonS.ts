import {MuWidget} from "../../lib/MuWidget";
import {JSONS} from "../../src/utils/JSONS";

export class JsonS extends MuWidget
{
    beforeIndex() {
        this.muAppendContent(`
            <textarea mu="src"></textarea>
            <div>
                <span class="btn" mu="bToken">Tokenize</span>
                <span class="btn" mu="bParse">Parse</span>            
            </div>
            <pre mu="res"></pre>
        `);
    }

    bToken_click() {
        const jss = new JSONS();
        this.ui.res.innerText = JSON.stringify(jss.tokenize(this.ui.src.value), null, 4);
    }

    bParse_click() {
        const jss = new JSONS();
        jss.tokens = jss.tokenize(this.ui.src.value);
        this.ui.res.innerText = JSON.stringify(jss.parseCollection(), null, 4);
    }

}