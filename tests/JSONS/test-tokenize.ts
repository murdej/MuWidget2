import {JSONS} from "../../src/utils/JSONS";
import readlinePromise from "readline-promise";

const jss = new JSONS();

console.log("Hello :)");
/* const rl = readlinePromise.createInterface({
    input: process.stdin,
    output: process.stdout
});

const userInput = await rl.question('Enter some text: '); */

for(const src of [
    // `"ab" /* cd */ ,:`,
    // `a b c /* /* fff */ */ d e `,
    // `{ foo: bar, ee:42, [ 1, ert, true, null, "/* sdfgsdfg */\n\n{}[],:" ]}`,
    // `Foo, Bar ee, "fgh", true, false, null, undefined`,
    `"foo\\\"bar", 
    'foo\'bar'`,
    // ``,
    // ``,
    // ``,
    'foo:bar',
    '{"foo":true,"bar":false,"eee":null}',
]) console.log(
    [
        src,
        jss.tokenize(src),
        JSONS.parse(src),
    ]
);