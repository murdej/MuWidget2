import { MuWidget } from "../../src/MuWidget";
import { ValidateResult } from "./ValidateResult";

export class SRLForm extends MuWidget {

	public action : UiSignAction;

	afterIndex() {
		super.afterIndex();
		this.setLogged(userInfo, false, true)
	}

	public static actionTitle : Record<UiSignAction, string> = {
		login: "Sign in",
		passwordRecovery: "Lost password",
		createAccount: "Join",
		logged: "Signed in"
	}

	public visiblePassword_change() {
		const vis = this.ui.visiblePassword.checked;
		this.ui.password.type = vis ? "text" : "password";
		this.muVisible(!vis && this.action === "createAccount", "pPassword2");
	}

	public bAction(action: UiSignAction) {
		this.setupAction(action);
	}

	public setupAction(action: UiSignAction) {
		this.action = action;
		this.ui.title.innerText = SRLForm.actionTitle[action];
		this.visiblePassword_change();
		this.muVisible(this.action === "createAccount", [ "bCreateAccount", "pAgreementWithTheContract" ]);
		this.muVisible(this.action === "login", "bLogin");
		this.muVisible(this.action === "passwordRecovery", "bPasswordRecovery");

		this.muVisible(this.action !== "passwordRecovery", [ "pPassword", "pVisiblePassword" ]);
		this.muVisible(this.action == "logged", "logged");
		this.muVisible(this.action != "logged", "noLogged");
	}

	public async bLogin_click() {
		const res = await this.tryLogin();
		if (res.isValid()) {
			UiFlashMessage.add("Přihlášeno " + res.result.token);
			this.setLogged(res.result, true);
		} else
			this.showErrors(res.errors);
	}

	protected async setLogged(res: {token:string, email:string}|null, doSendToken: boolean, doCheckToken: boolean = false) {
		this.setupAction(res ? "logged" : "login");
		this.ui.loggedEmail.innerText = res?.email;
		// @ts-ignore
		if (doSendToken) ALSign.setUserInfo(res?.token, res?.email);
		if (doCheckToken && res) {
			const checkRes = await this.doCheckToken(true, res.token);
			if (!checkRes) this.setupAction("login");
		} else this.setCheckTokenStatus(true);
	}

	private async tryLogin() : Promise<ValidateResult> {
		let res = new ValidateResult();
		const password = this.ui.password.value;
		const email = this.ui.email.value.toLowerCase();
		if (!validateEmail(email))
			res.add('email', 'Zadejte platný email');

		if (res.isValid()) {
			res.merge(await this.cl.login(this.muFetchData()));
		}

		return res;
	}

	public async bCreateAccount_click() {
		const res = await this.tryRegister();
		if (res.isValid()) {
			UiFlashMessage.add("Účet je založen " + res.result.token);
			this.setLogged(res.result, true);
		} else
			this.showErrors(res.errors);
	}

	private async tryRegister() : Promise<ValidateResult> {
		let res = new ValidateResult();
		const password = this.ui.password.value;
		if (password.length < 6)
			res.add('password', 'Heslo musí mít aspoň 6 znaků');
		if (!this.ui.visiblePassword.checked && password != this.ui.password2.value)
			res.add('password2', 'Hesla nejsou shodná');
		const email = this.ui.email.value.toLowerCase();
		if (!validateEmail(email))
			res.add('email', 'Zadejte platný email');
		if (!this.ui.agreementWithTheContract.checked)
			res.add('agreementWithTheContract', 'Je třeba souhlasit s podmínkami');

		if (res.isValid()) {
			// res.merge(Register on server));
		}

		return res;
	}

	bLogout_click() {
		this.setLogged(null, true);
	}

	setCheckTokenStatus(checked : boolean) {
		this.muVisible(!checked, "loggedInfoChecking");
		this.muVisible(checked, "loggedInfo");
	}
}

export type UiSignAction = "login"|"createAccount"|"passwordRecovery"|"logged";

function validateEmail(email : string) : boolean {
	const emailEreg = /^(.*)@[a-z0-9.]+\.[a-z]{2,}$/;
	return email.match(emailEreg) !== null;
}

