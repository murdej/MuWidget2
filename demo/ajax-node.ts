import { Ajax } from "../src/Ajax";

const ajax = new Ajax("http://ikna.lo/app/cl");
ajax.data = {
	name: "getMyBooks",
	context: {},
	pars: [null]
};
ajax.then(data => console.log(data));
ajax.call();
