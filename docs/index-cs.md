[TOC]


# Syntaxe v HTML

Všechny údaje pro `MuWidget` se zapisují jako atributy začínající `mu-`

| Atribut       | Význam                                                       |
| ------------- | ------------------------------------------------------------ |
| `mu-widget`   | Určuje že HTML element je samostatný widget. Obsahem je název servisní třídy. |
| `mu-id`       | Identifikátor elementu který má být dostupný v kolekci `this.ui`, dále se používá při obsluze událostí. |
| `mu-template` | Určuje že HTML element je šablona. Při indexaci se element vyjme z dokumentu a uschová pro dynamické vytváření nových widgetů |
| `mu-params`   | Iniciační parametry servisní třídy. Nastaví se při aktivaci widgetu. |
| `mu-bind`     | Formule pro databinding                                      |
| `mu-noindex`  | Nezpracovávat tento ani podřízené elementy.                  |

# Přístup k elementů a podřízeným widgetům

HTML elementy s atributem `mu-id` jsou dostupné v kolekci `this.ui`. Pokud je element zároveň widget, je tento widget dostupný v kolekci `this.muNamedWidget`.

Všechny podřízené widgety, bez ohledu na to zda mají atribut `mu-id` jsou dostupné v seznamu `this.muSubWidgets`

# Mapování obsluhy událostí

Existuje více možností jak mapovat obsluhu události.

## Podle jmenné konvence

Pokud existuje metoda ve formátu `[mu-id elementu]_[název události]` namapuje se na danou událost na daém elementu. Příklad:

```html
<div mu-widget="ClickCounter">
	<button mu-id="bCounter">Click</button>    
</div>
```



```javascript
class ClickCounter {
	public bCounter_click() {
		...
	}    
}
```

## Atributem v HTML

```html
<div mu-widget="ClickCounter">
	<button mu-click="bCounter_click">Click</button>
</div>
```

# Události widgetu

Servisní třída widgetu může definovat vlastní události. Tyto události se mapují stejným způsobem jako události HTML elementů.

Jako první je třeba událost zaregistrovat v metodě `afterIndex` zavoláním `this.muRegisterEvent`. Je možné zaregistrovat i více událostí najednou.

```typescript
	public afterIndex()
	{
		this.muRegisterEvent("save", "cancel");
	}
```

Událost se vyvolá metodou `this.muDispatchEvent`. Jako 1. parametr se uvádí název událostí, další parametry jsou volitelné a předají se obsluze události.

```javascript
public bSave_click()
{
	...
    this.muDispatchEvent("save", foo.id);
}
```

V nadřazeném widgetu je možné namapovat obsluhu stejně jako u HTML elementů:

```html
<div mu-widget="App">
    <div mu-widget="ItemEditor" mu-id="editor">
        ...
        <button mu-id="bSave">
            Uložit
        </button>
    </div>
    ...
</div>
```

```typescript
class App {
    public editor_save(sender, ev, fooId)
    {
        ...
    }
}
```

Alternativně je možné použít metodu `addEventListener` například takto:

```typescript
this.muNamedWidget.editor.addEventListener("save", (sender, ev, fooId) => ...) 
```

# Dynamické vytváření nových widgetů

# Data binding

`MuWidget` umožňuje obousměrný data binding. Neprovádí se automaticky ale na vyžádání zavoláním `this.muBindData` pro přenesení dat do HTML nebo `this.muFetchData` pro načtení dat z HTML.

Formule data bindingu se zapisuje do atributu `mu-bind` a má následující syntaxi.

<div>
<code>
    <b>ZdrojovéPole</b>[[<b>|bindFiltr</b>[<b>(parametry)</b>][<b>|dalšíFiltr</b>...]][<b>směr</b> <b>cíl</b>[[<b>|fetchFiltr</b>[<b>(parametry)</b>][<b>|dalšíFiltr...</b>]]]]][<b>;další binding</b>]
</code>
</div>

Jediný povinný fragment je ZdrojovéPole. Ostatní jsou nepovinné.

**ZdrojovéPole** - pole dat ze kterého se bere hodnota.

**BindFiltr** - filtr(y) který se použije při `muBindData`. Před název filtru se zadává znak `|`. Filtr může mít parametry, je možné použít pouze statické parametry. Je možné řadit i více filtrů za sebe.

**Směr**

|Kód | Význam |
| -------- | ------------------------- |
| `:`      | Pouze Bind                |
| `::`     | Bind i Fetch             |
| `^`      | Pouze Fetch              |
| Nezadáno | Automaticky dle příslušného HTML elementu |

**cíl** - určujě kam / odkud se hodnota v elementu uloží / získá.

**fetchFilter** - filtr(y) který se použije při `muFetchData`.  Syntaxe je shodná s bindFiltr.

## Příklad

HTML:

```html
<a mu-bind='articleSlug|prepend("/article/"):href; articleName:innerText'></a>
```

Data:

```json
{
	"articleSlug": "about-us",
	"articleName": "About us"
}
```

Výsledné HTML:

```html
<a href="/article/about-us">About us</a>
```

## Cíl

Pokud:

- je cíl řetězec začínají písmenem nastavuje, nastavuje se javascript property daného elementu.
* začíná tečkou `.` nastavuje javascript property instance servisní třídy daného elementu.
- začíná `@attr.` nastavuje se html atribut elementu.
- je `@foreach` projde hodnotu jako pole a pro každý element vytvoří nový widget.
- `@options`  se používá pro jednoduché naplnění html elementu `<select>`

## Filtry

Filtry umožňují transformovat hodnotu. Filtry mohou být lokální - metody definované v servisní třídě, nebo globální.

### Předdefinované filtry

`toLower` : změní velikost písmen na malé.

`toUpper` : změní velikost písmen na velké.

`short(maxLen, sufix = "...")` : pokud je řetězec delší než zadaný počet znaků, zkrátí se a přidá .

`tern(valueOnTrue, valueOnFalse)` : obdoba ternálního operátoru, v případě že je hodnota vyhodnotitelná jako `true` změní hodnotu na hodnotu prvního parametru, v opačném případě na hodnotu druhého parametru (příklad změny `bool` na "ano" a "ne": `value|tern("ano", "ne")` ).

`prepend(prefix, ifAny = false)` : přidá text před hodnotu. Pokud je druhý parametr `true` a hodnota prázdná, text se nepřidá.

`append(sufix, ifAny = false)` : přidá text za hodnotu. Pokud je druhý parametr `true` a hodnota prázdná, text se nepřidá.


### Vlastní filtry

Lokální filtr (platný pouze pro aktuální widget) se zapíše jako metoda servisní třídy widgetu ve kterém se používá.

1. parametr obsahuje hodnotu (nebo výsledek předchozího filtru).
2. parametr bude obsahovat další doplňující údaje (prozatím prázdný objekt, pro budoucí použití).
3.  a další parametry obsahují volitelné parametry z formule.

```javascript
public strRepeat(value, ev, count : number) {
    return value.repeat(count);
}
```

Globální filtry se zadávají do statické kolekce `MuBinder.filters`

```javascript
MuBinder.filters.strRepeat(value, ev, count : number) => value.repeat(count);
```

## Automatické určení cíle

Pokud není zadán cíl určuje se podle HTML elementu a případně dalších parametrů:

| Cílový element                              | Směr | Cíl         |
| ------------------------------------------- | ---- | ----------- |
| `<input type="checkbox" />`                 | `::` | `checked`   |
| `<input type="file" />`                     | `^`  | `files`     |
| `<input ...`                                | `::` | `value`     |
| `<img />`<br />`<audio />`<br />`<video />` | :    | `src`       |
| Vše ostatní                                 |      | `innerText` |

