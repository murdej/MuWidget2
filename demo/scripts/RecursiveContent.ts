import { MuWidget } from "../../src/MuWidget";

export class RecursiveContentItem extends MuWidget {
	afterIndex() {

	}
}

export class RecursiveContent extends MuWidget {
	afterIndex() {
		this.muBindData({
			ww: "dddd",
			subitems: [
				{
					label: "L1 I1",
					subitems: [
						{
							label: "L2 I1",
							subitems: [

							]
						},
						{
							label: "L2 I2",
							subitems: [
								{
									label: "Fooo",
									subitems: [

									]
								},
								{
									label: "Fooo",
									subitems: [

									]
								}

							]
						}

					]
				}
			]
		});
	}
}
