var RadioList = function(input) 
{ 
	this.indexInputs(input);
}
RadioList.prototype = {
	indexInputs: function(input)
	{
		this.inputs = input.form.querySelectorAll("[name='" + input.name + "']");
		for(var i = 0, l = this.inputs.length; i < l; i++)
			this.inputs[i].radioList = this;
	},
	val: function(v)
	{
		if (v === undefined)
			return this.getValue();
		else
			this.setValue(v);
	},
	getValue: function()
	{
		for(var i = 0, l = this.inputs.length; i < l; i++)
			if (this.inputs[i].checked) return this.inputs[i].value;
	},
	setValue: function(v)
	{
		for(var i = 0, l = this.inputs.length; i < l; i++)
			this.inputs[i].checked = v == this.inputs[i].value;
	},
	addEventListener: function(name, callback)
	{
		var self = this;
		var fn = function()
		{
			return callback.apply(self, arguments);
		};
		for(var i = 0, l = this.inputs.length; i < l; i++)
		{
			this.inputs[i].addEventListener(name, fn);
		}
	}
}

RadioList.muRegister = function()
{
	window.MuWidgetPlugIns = window.MuWidgetPlugIns || [];
	window.MuWidgetPlugIns.push({
		indexPrepareElement: function(ev)
		{
			if (ev.element.tagName.toLowerCase() == "input" && ev.element.type == "radio")
			{
				if (!ev.element.radioList)
				{
					ev.opts = ev.widget.muGetElementOpts(ev.element);
					ev.element = new RadioList(ev.element);
				}
				else ev.element = null;
			}
		}
	});
}