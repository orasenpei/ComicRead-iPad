
let solid_js_web = require("solid-js/web");
let components_Manga = require("components/Manga");
let core = require("core");
let helper = require("helper");
let solid_js = require("solid-js");
let solid_js_store = require("solid-js/store");
let components_Toast = require("components/Toast");
let request = require("request");
let components_InputDialog = require("components/InputDialog");
let userscript_detectAd = require("userscript/detectAd");
let userscript_ehTagRules = require("userscript/ehTagRules");
//#region src/site/ehentai/myTags.ts
const getTagSetHtml = async (tagset) => {
	const url = tagset ? `/mytags?tagset=${tagset}` : "/mytags";
	const res = await core.request(url, { fetch: true });
	return helper.domParse(res.responseText);
};
const collectTags = (html, tagList = []) => {
	const defaultColor = html.querySelector("#tagcolor").value.slice(1) || "0";
	const [, ...tagEleList] = [...html.getElementById("usertags_outer").children];
	for (const e of tagEleList) {
		const id = Number(e.id.split("usertag_")[1]);
		const preview = e.querySelector(`#tagpreview_${id}`);
		const { color: fontColor, borderColor } = preview.style;
		let [group, name] = preview.title.split(":");
		switch (group) {
			case "female":
			case "male":
			case "mixed": group = "gender";
		}
		const color = Number.parseInt(e.querySelector(`#tagcolor_${id}`).value.slice(1) || defaultColor, 16);
		tagList.push({
			e,
			id,
			title: preview.title,
			color,
			fontColor,
			borderColor,
			group,
			name,
			weight: Number(e.querySelector("input[id^=tagweight_]").value),
			watch: e.querySelector(`#tagwatch_${id}`).checked,
			hidden: e.querySelector(`#taghide_${id}`).checked,
			order: -1
		});
	}
	return tagList;
};
const sortTagList = (tagList) => {
	const collator = helper.getNaturalCollator();
	const sortFn = (a, b) => {
		if (a.color !== b.color) return b.color - a.color;
		if (a.group !== b.group) return collator.compare(a.group, b.group);
		if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
		if (a.watch !== b.watch) return a.watch ? -1 : 1;
		if (a.weight !== b.weight) return b.weight - a.weight;
		return collator.compare(a.name, b.name);
	};
	let i = -tagList.length;
	for (const tag of tagList.sort(sortFn)) tag.order = i++;
	return tagList;
};
const getMyTags = async () => {
	const tagSetList = [];
	const defaultTagSet = await getTagSetHtml();
	await Promise.all([...defaultTagSet.querySelectorAll("#tagset_outer select option")].map(async (option) => {
		const tagSet = option.selected ? defaultTagSet : await getTagSetHtml(option.value);
		if (tagSet.querySelector("#tagset_enable")?.checked) tagSetList.push(tagSet);
	}));
	const tagList = [];
	for (const html of tagSetList) collectTags(html, tagList);
	return sortTagList(tagList);
};
const handleMyTagsChange = /* @__PURE__ */ new Set();
const updateMyTags = async () => {
	const tagList = await getMyTags();
	for (const fn of handleMyTagsChange) await fn(tagList);
};
//#endregion
//#region src/site/ehentai/sortTags.ts
const updateSortCss = (tagList) => {
	let cssText = "tr a :is(.gltm, .glink + div:not([class])) { display: flex; }";
	for (const { title, order } of tagList) cssText += `\n.gt[title="${title}"] { order: ${order}; }`;
	return GM.setValue("ehTagSortCss", cssText);
};
/** 按照 mytags 上配置的标签顺序对其他页面上的标签进行排序 */
const sortTags = async (pageCtx) => {
	handleMyTagsChange.add(updateSortCss);
	switch (pageCtx.type) {
		case "p":
		case "l":
		case "t": return helper.css(await helper.ensureGmValue("ehTagSortCss", updateMyTags));
		case "mytags": {
			let style;
			const sortDom = (tagList) => {
				let cssText = `
          #usertags_outer { display: flex; flex-direction: column; }
          #usertags_outer > div { margin: unset; }
          #usertag_0 { order: -${tagList.length}; }`;
				for (const { order, id } of tagList) cssText += `\n#usertag_${id} { view-transition-name: _${id}; order: ${order}; }`;
				style ||= GM_addElement("style", { textContent: cssText });
				style.textContent = cssText;
			};
			handleMyTagsChange.add((tagList) => {
				if (!document.startViewTransition) return sortDom(tagList);
				document.startViewTransition(() => sortDom(tagList));
			});
		}
	}
};
//#endregion
//#region src/site/ehentai/colorizeTag.ts
const buildTagList = (tagList, prefix) => `\n${Array.from(tagList, (tag) => `${prefix}${CSS.escape(tag)}`).join(",\n")}\n`;
/** 获取最新的标签颜色数据 */
const updateTagColor = async (tagList) => {
	const backgroundMap = {};
	const borderMap = {};
	const colorMap = {};
	for (const tag of tagList) {
		const { color, borderColor, fontColor } = tag;
		const title = tag.title.replaceAll(" ", "_");
		(backgroundMap[color] ||= /* @__PURE__ */ new Set()).add(title);
		(borderMap[borderColor] ||= /* @__PURE__ */ new Set()).add(title);
		(colorMap[fontColor] ||= /* @__PURE__ */ new Set()).add(title);
	}
	let cssText = "";
	for (const [background, tags] of Object.entries(backgroundMap)) {
		cssText += `:is(${buildTagList(tags, "#td_")})`;
		cssText += `{ background: #${Number(background).toString(16).padStart(6, "0")}; }\n\n`;
	}
	for (const [border, tags] of Object.entries(borderMap)) {
		cssText += `:is(${buildTagList(tags, "#td_")}).gt`;
		cssText += `{ border-color: ${border}; }\n\n`;
	}
	for (const [color, tags] of Object.entries(colorMap)) {
		cssText += `:is(${buildTagList(tags, "#td_")}):not(.gt)`;
		cssText += `{ border-color: ${color}; }\n\n`;
		cssText += `#taglist a:is(${buildTagList(tags, "#ta_")})`;
		cssText += `{ color: ${color} !important; position: relative; }\n\n`;
	}
	cssText += `
    /* 禁用 eh 的变色效果，必须使用 !important */
    #taglist a[id] { color: var(--tag) !important; position: relative; }
    #taglist a[id]:hover { color: var(--tag-hover) !important; }

    #taglist a[id]::after {
      content: "";
      background: var(--color);
      width: 100%;
      position: absolute;
      left: 0;
      height: 2px;
      bottom: -7px;
    }
    .tup { --color: var(--tup) }
    .tdn { --color: var(--tdn) }
    #taglist a[id][style="color: blue;"] { --color: blue; }

    /* 避免被上一行的下划线碰到 */
    #taglist div:is(.gt, .gtl, .gtw) { margin-top: 1px; }
  `;
	await GM.setValue("ehTagColorizeCss", cssText);
	return cssText;
};
/** 标签染色 */
const colorizeTag = async (_, pageCtx) => {
	handleMyTagsChange.add(updateTagColor);
	switch (pageCtx.type) {
		case "t":
		case "gallery": {
			let cssText = getComputedStyle(document.body).backgroundColor === "rgb(52, 53, 59)" ? "--tag: #DDDDDD; --tag-hover: #EEEEEE; --tup: #00E639; --tdn: #FF3333;" : "--tag: #5C0D11; --tag-hover: #8F4701; --tup: green; --tdn: red;";
			cssText = `#taglist { ${cssText} }\n\n`;
			cssText += await helper.ensureGmValue("ehTagColorizeCss", updateMyTags);
			helper.css(cssText);
			break;
		}
		case "mytags":
			helper.hijackFn("usertag_callback", helper.debounce(updateMyTags));
			await updateMyTags();
	}
	await sortTags(pageCtx);
};
//#endregion
//#region src/userscript/nhentaiApi.ts
const nhApi = (url, details) => core.request(url, {
	responseType: "json",
	headers: { "User-Agent": navigator.userAgent },
	fetch: false,
	...details
});
const getNhentaiData = async (id) => {
	const { response } = await nhApi(`https://nhentai.net/api/v2/galleries/${id}`, {
		errorText: helper.t("site.ehentai.nhentai_error"),
		noTip: true
	});
	return response;
};
const searchNhentai = async (title) => {
	const { response } = await nhApi(`https://nhentai.net/api/v2/search?query=${encodeURIComponent(title)}`, {
		errorText: helper.t("site.ehentai.nhentai_error"),
		noTip: true
	});
	return response.result;
};
const toImgList = (data) => data.pages.map((page) => ({
	src: `https://i.nhentai.net/${page.path}`,
	width: page.width,
	height: page.height
}));
//#endregion
//#region src/site/ehentai/helper/context.tsx
const featureOptions = {
	/** 关联外站 */
	cross_site_link: true,
	/** 增加快捷键操作 */
	add_hotkeys_actions: true,
	/** 识别广告页 */
	detect_ad: true,
	/** 快捷收藏 */
	quick_favorite: true,
	/** 标签染色 */
	colorize_tag: true,
	/** 快捷评分 */
	quick_rating: true,
	/** 快捷查看标签定义 */
	quick_tag_define: true,
	/** 悬浮标签列表 */
	float_tag_list: true,
	/** 自动调整配置 */
	auto_adjust_option: false,
	/** 标签检查 */
	tag_lint: false,
	/** 展开标签列表 */
	expand_tag_list: true,
	autoShow: false,
	defaultOption: {
		imgRecognition: { enabled: true },
		darkMode: false
	}
};
const getPageContext = async () => {
	if (location.pathname === "/mytags") return { type: "mytags" };
	if (Reflect.has(unsafeWindow, "mpvkey")) return {
		type: "mpv",
		isManga: true
	};
	if (!Reflect.has(unsafeWindow, "display_comment_field")) {
		const type = (helper.querySelector("option[value=\"t\"]")?.parentElement)?.value;
		if (type) return { type };
		return;
	}
	let imgNum = 0;
	imgNum = Number(helper.querySelector(".gtb .gpc")?.textContent?.replaceAll(",", "").match(/\d+/gu)?.at(-1));
	if (Number.isNaN(imgNum)) {
		const { responseText: html } = await core.request(location.href);
		imgNum = Number(/(?<=class="gdt2">)\d+(?= pages<\/td>)/u.exec(html)?.[0]);
	}
	return {
		type: "gallery",
		isManga: true,
		galleryId: location.pathname.split("/")[2],
		galleryTitle: helper.querySelector("#gn")?.textContent || void 0,
		japanTitle: helper.querySelector("#gj")?.textContent || void 0,
		imgNum,
		imagesPerPage: 0,
		imgList: helper.range(imgNum, ""),
		pageList: [],
		fileNameList: [],
		dom: {
			newTagField: helper.querySelector("#newtagfield"),
			sidebar: helper.querySelector("#gd5")
		}
	};
};
//#endregion
//#region src/site/ehentai/helper/LoadButton.tsx
var _tmpl$$7 = /*#__PURE__*/ solid_js_web.template(`<a href=javascript:;>`);
/** 放在原生右侧工具栏和标签选项里的漫画加载按钮 */
const LoadButton = (props) => {
	const tip = solid_js.createMemo(() => {
		const imgList = props.context.store.imgListMap[props.id]?.imgList;
		if (imgList?.length === 0) return ` loading - 0/${props.imgNum}`;
		const progress = imgList?.filter(Boolean).length;
		switch (imgList?.length) {
			case void 0: return " Load comic";
			case progress: return " Read";
			default: return ` loading - ${progress}/${props.imgNum}`;
		}
	});
	return (() => {
		var _el$ = _tmpl$$7();
		_el$.$$click = (e) => {
			props.onClick?.(e);
			props.context.showComic(props.id);
		};
		solid_js_web.insert(_el$, tip);
		return _el$;
	})();
};
solid_js_web.delegateEvents(["click"]);
//#endregion
//#region src/site/ehentai/helper/index.ts
/** 获取所有标签 */
const getTaglist = () => {
	const lockTags = /* @__PURE__ */ new Set();
	const weakTags = /* @__PURE__ */ new Set();
	for (const tag of helper.querySelectorAll("#taglist table [id^=td_]")) {
		const [a] = tag.getElementsByTagName("a");
		if (a.classList.contains("tdn")) continue;
		if (a.classList.contains("tup") || tag.classList.contains("gt")) lockTags.add(tag.id.slice(3));
		else if (tag.classList.contains("gtl")) weakTags.add(tag.id.slice(3));
	}
	return [lockTags, weakTags];
};
const handleTagName = (tag) => {
	const [namespace, name] = tag.trim().split(":");
	if (!name) return ["", ""];
	return [namespace, name.replaceAll(/[^a-z-_ ]/giu, "")];
};
/** 命名空间缩写 */
const namespaceAbbr = [
	["artist", "a"],
	[
		"character",
		"c",
		"char"
	],
	[
		"cosplayer",
		"c",
		"os"
	],
	["female", "f"],
	[
		"group",
		"g",
		"circle"
	],
	[
		"language",
		"l",
		"lang"
	],
	["male", "m"],
	["mixed", "x"],
	["other", "o"],
	[
		"parody",
		"p",
		"series"
	],
	["reclass", "r"]
];
/** 获取标签的完整写法 */
const getTagNameFull = (tag) => {
	const [namespace, name] = handleTagName(tag);
	for (const target of namespaceAbbr) if (target.includes(namespace)) return `${target[0]}:${name}`;
	return tag;
};
/** 画廊分类图标对应的 class。在列表页是「.ct2」，在画廊里是「.gt2」 */
const categoriesMap = {
	Western: "ta",
	Misc: "t1",
	Doujinshi: "t2",
	Manga: "t3",
	"Artist CG": "t4",
	"Game CG": "t5",
	"Image Set": "t6",
	Cosplay: "t7",
	"Asian Porn": "t8",
	"Non-H": "t9"
};
/** 判断是否当前画廊是否是指定的分类 */
const isInCategories = (...name) => Boolean(helper.querySelector(`#gdc > .cs:is(${name.map((c) => `.c${categoriesMap[c]}`).join(", ")})`));
/** 更新 pagelist 里的 nl 参数 */
const setNl = (pageCtx, i, nl) => {
	const url = new URL(pageCtx.pageList[i]);
	url.searchParams.set("nl", nl);
	pageCtx.pageList[i] = url.href;
};
//#endregion
//#region src/site/ehentai/crossSiteLink.tsx
var _tmpl$$6 = /*#__PURE__*/ solid_js_web.template(`<div style=opacity:1.0><a>`);
var _tmpl$2$5 = /*#__PURE__*/ solid_js_web.template(`<td>`);
var _tmpl$3$3 = /*#__PURE__*/ solid_js_web.template(`<tr><td class=tc>:`);
var _tmpl$4$3 = /*#__PURE__*/ solid_js_web.template(`<td class=tc style=text-align:left>`);
var _tmpl$5$1 = /*#__PURE__*/ solid_js_web.template(`<img src=https://ehgt.org/g/mr.gif class=mr alt=">">`);
var _tmpl$6 = /*#__PURE__*/ solid_js_web.template(`<a target=_blank>`);
const nhentai = async ({ setState }, { galleryTitle, galleryId }) => {
	return (await searchNhentai(galleryTitle)).map(({ id, english_title, japanese_title, media_id }) => {
		const itemId = `@nh:${id}`;
		setState("imgListMap", itemId, { getImgList: async ({ dynamicLazyLoad }) => {
			const galleryData = await getNhentaiData(`${id}`);
			const imgList = toImgList(galleryData);
			return dynamicLazyLoad({
				loadImg: async (i) => {
					const imgRes = await core.request(imgList[i].src, {
						headers: { Referer: `https://nhentai.net/g/${id}` },
						responseType: "blob",
						fetch: false
					});
					return URL.createObjectURL(imgRes.response);
				},
				length: imgList.length,
				id: itemId
			});
		} });
		return {
			id: itemId,
			showText: `${id}`,
			title: japanese_title || english_title,
			href: `https://nhentai.net/g/${id}`,
			class: galleryId === media_id ? "gt" : "gtl"
		};
	}).toSorted((a, b) => (a.class === "gt" ? 0 : 1) - (b.class === "gt" ? 0 : 1) || Number(b.showText) - Number(a.showText));
};
nhentai.errorTip = (_, { galleryTitle }) => helper.t("site.ehentai.nhentai_failed", { nhentai: `<a href='https://nhentai.net/search/?q=${galleryTitle}' target="_blank"> <u> nhentai </u> </a>` });
const hitomi = async ({ setState }, { galleryId }) => {
	const domain = "gold-usergeneratedcontent.net";
	const downImg = async (url) => {
		const imgRes = await core.request(url, {
			headers: { Referer: `https://hitomi.la/reader/${galleryId}.html` },
			responseType: "blob",
			fetch: false
		});
		return URL.createObjectURL(imgRes.response);
	};
	const res = await core.request(`https://ltn.${domain}/galleries/${galleryId}.js`, {
		errorText: helper.t("site.ehentai.hitomi_error"),
		noTip: true,
		noCheckCode: true
	});
	switch (res.status) {
		case 404: return [];
		case 200: break;
		default: throw new Error(helper.t("site.ehentai.hitomi_error"));
	}
	const data = JSON.parse(res.responseText.slice(18));
	const itemId = `@hitomi:${data.id}`;
	setState("imgListMap", itemId, { getImgList: async ({ dynamicLazyLoad }) => {
		const { responseText: ggScript } = await core.request(`https://ltn.${domain}/gg.js?_=${Date.now()}`, {
			errorText: helper.t("site.ehentai.hitomi_error"),
			noTip: true
		});
		let gg = {};
		eval(ggScript);
		return dynamicLazyLoad({
			loadImg: async (i) => {
				const { hash, name } = data.files[i];
				const imageId = gg.s(hash);
				const m = /[\da-f]{61}(?<hi>[\da-f]{2})(?<lo>[\da-f])/u.exec(hash).groups;
				const g = Number.parseInt(m.lo + m.hi, 16);
				const url = `https://w${gg.m(g) + 1}.${domain}/${gg.b}${imageId}/${hash}.webp`;
				return {
					src: await downImg(url),
					name
				};
			},
			length: data.files.length,
			id: itemId,
			concurrency: 1
		});
	} });
	return [{
		id: itemId,
		showText: data.id,
		title: data.title,
		href: `https://hitomi.la/galleries/${data.id}`,
		class: "gt"
	}];
};
hitomi.errorTip = () => helper.t("site.ehentai.hitomi_error");
/** 关联外站 */
const crossSiteLink = async (coreCtx, pageCtx) => {
	if (pageCtx.type !== "gallery") return;
	if (!pageCtx.galleryTitle) return core.toast.error(helper.t("site.ehentai.html_changed_link_failed"));
	const siteList = [];
	if (isInCategories("Doujinshi", "Manga", "Artist CG", "Game CG", "Image Set")) siteList.push(hitomi);
	if (isInCategories("Doujinshi", "Manga")) siteList.push(nhentai);
	if (siteList.length === 0) return;
	const [comicMap, setComicMap] = solid_js_store.createStore({});
	const ItemTag = (props) => (() => {
		var _el$ = _tmpl$$6(), _el$2 = _el$.firstChild;
		solid_js_web.effect((_p$) => {
			var _v$ = `td_${props.id}`, _v$2 = props.class, _v$3 = props.title, _v$4 = props.id, _v$5 = props.href, _v$6 = `return toggle_tagmenu(1, '${props.id}',this)`, _v$7 = props.title, _v$8 = props.showText;
			_v$ !== _p$.e && solid_js_web.setAttribute(_el$, "id", _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.className(_el$, _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "title", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$2, "id", _p$.o = _v$4);
			_v$5 !== _p$.i && solid_js_web.setAttribute(_el$2, "href", _p$.i = _v$5);
			_v$6 !== _p$.n && solid_js_web.setAttribute(_el$2, "onclick", _p$.n = _v$6);
			_v$7 !== _p$.s && solid_js_web.setAttribute(_el$2, "title", _p$.s = _v$7);
			_v$8 !== _p$.h && (_el$2.innerText = _p$.h = _v$8);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0,
			i: void 0,
			n: void 0,
			s: void 0,
			h: void 0
		});
		return _el$;
	})();
	const renderList = () => solid_js_web.render(() => solid_js_web.createComponent(solid_js.For, {
		get each() {
			return Object.entries(comicMap);
		},
		children: ([site, itemList]) => (() => {
			var _el$3 = _tmpl$3$3(), _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild;
			solid_js_web.setAttribute(_el$3, "id", `${site}_tagline`);
			solid_js_web.insert(_el$4, site, _el$5);
			solid_js_web.insert(_el$3, solid_js_web.createComponent(solid_js.Show, {
				when: typeof itemList !== "string",
				get fallback() {
					return (() => {
						var _el$7 = _tmpl$4$3();
						_el$7.innerHTML = itemList;
						return _el$7;
					})();
				},
				get children() {
					var _el$6 = _tmpl$2$5();
					solid_js_web.insert(_el$6, solid_js_web.createComponent(solid_js.For, {
						each: itemList,
						children: ItemTag
					}));
					return _el$6;
				}
			}), null);
			return _el$3;
		})()
	}), helper.querySelector("#taglist tbody"));
	renderList();
	helper.hijackFn("tag_update_vote", () => {
		for (const e of helper.querySelectorAll("#nh_tagline")) e.remove();
		renderList();
	});
	const icon = () => _tmpl$5$1();
	const TagMenu = (props) => solid_js_web.createComponent(solid_js.For, {
		get each() {
			return props.children;
		},
		children: (item) => [icon(), item]
	});
	const tagmenu_act_dom = document.getElementById("tagmenu_act");
	let dispose;
	helper.hijackFn("_refresh_tagmenu_act", (rawFn, [a]) => {
		dispose?.();
		if (!a.id.startsWith("@")) return rawFn(a);
		if (tagmenu_act_dom.children.length > 0) tagmenu_act_dom.innerHTML = "";
		dispose = solid_js_web.render(() => solid_js_web.createComponent(TagMenu, { get children() {
			return [(() => {
				var _el$9 = _tmpl$6();
				_el$9.innerText = " Jump";
				solid_js_web.effect(() => solid_js_web.setAttribute(_el$9, "href", a.href));
				return _el$9;
			})(), solid_js_web.createComponent(LoadButton, {
				get id() {
					return a.id;
				},
				get imgNum() {
					return pageCtx.imgNum;
				},
				context: coreCtx
			})];
		} }), tagmenu_act_dom);
	});
	for (const getSiteComic of siteList) {
		setComicMap(getSiteComic.name, "searching...");
		try {
			const itemList = await getSiteComic(coreCtx, pageCtx);
			if (itemList.length > 0) setComicMap(getSiteComic.name, itemList);
			else setComicMap(getSiteComic.name, "null");
		} catch (error) {
			const errorTip = getSiteComic.errorTip(coreCtx, pageCtx);
			helper.log.error(errorTip, error);
			setComicMap(getSiteComic.name, errorTip);
		}
	}
	const { adList } = coreCtx.store.imgListMap[""];
	if (!adList) return;
	for (const itemList of Object.values(comicMap)) {
		if (typeof itemList === "string") continue;
		if (itemList.length === 1) coreCtx.setState("imgListMap", itemList[0].id, { adList });
	}
};
//#endregion
//#region src/site/ehentai/expandTagList.tsx
/** 展开标签列表 */
const expandTagList = (_, pageCtx) => {
	if (pageCtx.type !== "t") return;
	helper.css`
    #taglist {
      --scrollbar-slider: ${getComputedStyle(helper.querySelector(".ido")).backgroundColor};

      scrollbar-color: var(--scrollbar-slider) transparent;
      scrollbar-width: thin;

      height: auto;
      max-height: 230px;
      padding: 0 3px;

      &::-webkit-scrollbar {
        width: 5px;
        height: 10px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-slider);
      }

      /* 长标签换行 */
      & [id^='td_'] a[id^='ta_'] {
        text-wrap: balance;
        word-break: keep-all;
        overflow-wrap: anywhere;
      }
    }

    .gl1t {
      &[data-tag-list-loading],
      &[data-tag-list-loading] * {
        cursor: progress;
      }

      &[data-show-tag-list] .gl6t,
      &:not([data-show-tag-list]) #taglist {
        display: none;
      }
    }
  `;
	const tagListMap = /* @__PURE__ */ new Map();
	const handleShow = async (item) => {
		if (item.style.cursor === "progress") return;
		if (!tagListMap.has(item)) {
			let html;
			let taglist = null;
			try {
				item.dataset.tagListLoading = "";
				const res = await core.request(item.querySelector("a").href, {
					noTip: true,
					errorText: "Fetch tag list error",
					noCheckCode: true
				});
				html = helper.domParse(res.responseText);
				taglist = html.querySelector("#taglist");
				if (!taglist) throw new Error("Fetch tag list error");
				const [, thumbnail] = html.querySelector("#gdt div[title][style]").style.background.split("\"");
				new Image().src = thumbnail;
				for (const a of taglist.querySelectorAll("a")) a.target = "_blank";
			} catch {
				taglist = document.createElement("div");
				taglist.id = "taglist";
				taglist.textContent = html?.querySelector(".d p")?.textContent || "Fetch tag list error";
			}
			item.querySelector(".gl3t").after(taglist);
			tagListMap.set(item, taglist);
			Reflect.deleteProperty(item.dataset, "tagListLoading");
		}
		if (Reflect.has(item.dataset, "showTagList")) Reflect.deleteProperty(item.dataset, "showTagList");
		else item.dataset.showTagList = "";
	};
	for (const item of helper.querySelectorAll(".gl1t")) item.addEventListener("click", (e) => e.target.matches(":not(a):is(.gl1t, .gl6t, .gl6t *, #taglist, #taglist *)") && handleShow(item));
	components_Manga.setDefaultHotkeys((hotkeys) => ({
		...hotkeys,
		float_tag_list: ["q"]
	}));
	const [mouseXY, setMouseXY] = solid_js.createSignal([0, 0]);
	document.addEventListener("pointermove", (e) => setMouseXY([e.clientX, e.clientY]));
	components_Manga.listenHotkey({ float_tag_list: () => {
		for (const item of document.elementsFromPoint(...mouseXY())) if (item.matches(".gl1t")) return handleShow(item);
	} });
	colorizeTag(_, pageCtx);
};
//#endregion
//#region src/site/ehentai/floatTagList.tsx
const MdPictureInPicture = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" stroke-width="0"><path d="M18 7h-6c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1m3-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2m-1 16.01H4c-.55 0-1-.45-1-1V5.98c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v12.03c0 .55-.45 1-1 1"/></svg>`;
const getDomPosition = (dom) => {
	const rect = dom.getBoundingClientRect();
	const computedStyle = getComputedStyle(dom);
	const leftBorder = parseFloat(computedStyle.borderLeftWidth);
	const leftPadding = parseFloat(computedStyle.paddingLeft);
	const topPadding = parseFloat(computedStyle.paddingTop);
	const topBorder = parseFloat(computedStyle.borderTopWidth);
	return {
		left: rect.left + leftBorder + leftPadding,
		top: rect.top + topBorder + topPadding,
		width: computedStyle.width,
		height: computedStyle.height
	};
};
const floatTagList = ({ store: coreStore }, pageCtx) => {
	if (pageCtx.type !== "gallery") return;
	const gd4 = helper.querySelector("#gd4");
	const gd4Style = getComputedStyle(gd4);
	/** 背景颜色 */
	let background = "rgba(0, 0, 0, 0)";
	let dom = gd4;
	while (background === "rgba(0, 0, 0, 0)") {
		background = getComputedStyle(dom).backgroundColor;
		dom = dom.parentElement;
	}
	const { borderColor } = getComputedStyle(helper.querySelector("#gdt"));
	/** 边框样式 */
	const border = `1px solid ${borderColor}`;
	helper.css`
    #comicread-tag-box {
      position: fixed;
      z-index: 2147483647;

      font-size: 12px;
      text-align: justify;

      background: ${background};
      box-shadow: 0 0 15px -3px #0004;
    }

    #comicread-tag-box > #gd4 {
      margin: 0;
      padding: 0;
      border: none;
    }

    /* 确保始终显示在最上层，防止和其他脚本冲突 */
    #ehs-introduce-box {
      z-index: 1;
    }

    #comicread-tag-box > #ehs-introduce-box {
      position: relative;
      width: 161px;
      height: 100%;
      border-left: ${border};
    }

    #comicread-tag-box-placeholder {
      cursor: pointer;

      float: left;
      display: flex;
      grid-area: gd4;
      justify-content: center;

      margin: 0 0 0 10px;
      padding: 0 0 0 5px;
      border-right: 1px solid ${borderColor};
      border-left: 1px solid ${borderColor};
    }

    #comicread-tag-box-placeholder svg {
      width: 17em;
      opacity: 0.5;
    }

    /* 防止在窗口变小时确认按钮被挤出范围 */
    #tagmenu_new {
      width: fit-content;
    }
  `;
	const { store, setState } = helper.useStore({
		open: false,
		top: 0,
		left: 0,
		opacity: 1,
		mouse: {
			x: 0,
			y: 0
		},
		bound: {
			width: 0,
			height: 0
		}
	});
	const setPos = (state, top, left) => {
		state.top = helper.clamp(-gd4.clientHeight * .75, top, state.bound.height);
		state.left = helper.clamp(-gd4.clientWidth * .75, left, state.bound.width);
	};
	const setOpacity = (opacity) => setState("opacity", helper.clamp(.5, opacity, 1));
	setOpacity(Number(localStorage.getItem("floatTagListOpacity")) || 1);
	document.addEventListener("pointermove", (e) => {
		setState((state) => {
			state.mouse.x = e.clientX;
			state.mouse.y = e.clientY;
		});
	});
	const hadnleResize = () => {
		setState((state) => {
			state.bound.width = window.innerWidth - gd4.clientWidth / 4;
			state.bound.height = window.innerHeight - gd4.clientHeight / 4;
			setPos(state, state.top, state.left);
		});
	};
	window.addEventListener("resize", hadnleResize);
	hadnleResize();
	helper.css("#comicread-tag-box", {
		display: () => store.open ? void 0 : "none",
		top: () => `${store.top}px`,
		left: () => `${store.left}px`,
		opacity: () => store.opacity
	});
	const placeholder = gd4.cloneNode();
	placeholder.id = "comicread-tag-box-placeholder";
	placeholder.style.display = "none";
	placeholder.addEventListener("click", () => setState("open", false));
	placeholder.innerHTML = MdPictureInPicture;
	gd4.before(placeholder);
	const ref = document.createElement("div");
	ref.id = "comicread-tag-box";
	ref.classList.add("comicread-ignore");
	document.body.append(ref);
	ref.addEventListener("wheel", (e) => {
		if (!e.shiftKey) return;
		e.stopPropagation();
		e.preventDefault();
		setOpacity(store.opacity + (e.deltaY > 0 ? -.05 : .05));
		localStorage.setItem("floatTagListOpacity", `${store.opacity}`);
	}, { passive: false });
	const initPos = {
		top: 0,
		left: 0
	};
	helper.useDrag({
		ref: gd4,
		handleDrag({ type, xy: [x, y], initial: [ix, iy] }) {
			switch (type) {
				case "down":
					if (!store.open) {
						const pos = getDomPosition(gd4);
						setState((state) => {
							state.top = pos.top;
							state.left = pos.left;
						});
					}
					initPos.top = store.top;
					initPos.left = store.left;
					break;
				case "up":
					setState((state) => {
						if (coreStore.manga.show) return;
						const rect = placeholder.getBoundingClientRect();
						if (helper.approx(state.top, rect.top, 50) && helper.approx(state.left, rect.left, 50)) state.open = false;
					});
					break;
				case "move": setState((state) => {
					setPos(state, initPos.top + y - iy, initPos.left + x - ix);
					state.open = true;
				});
			}
		},
		handleClick: (_, target) => target.click(),
		skip: (e) => !e.target.matches("#gd4, #taglist, #gwrd, td+td, [id^=comidread] *:not(a)")
	});
	let ehs;
	let ehsParent;
	const handleEhs = () => {
		if (ehs) return;
		ehs = helper.querySelector("#ehs-introduce-box");
		if (!ehs) return;
		ehsParent = ehs.parentElement;
		const autoComplete = helper.querySelector(".eh-syringe-lite-auto-complete-list");
		if (autoComplete) {
			autoComplete.classList.add("comicread-ignore");
			autoComplete.style.zIndex = "2147483647";
			document.body.append(autoComplete);
		}
		helper.hijackFn("toggle_tagmenu", () => unsafeWindow.selected_tagname || helper.querySelector("#ehs-introduce-box .ehs-close")?.click());
	};
	helper.createEffectOn(() => store.open, (open) => {
		handleEhs();
		if (open) {
			const { height, width } = gd4Style;
			placeholder.style.cssText = `height: ${height}; width: ${width};`;
			ref.style.height = height;
			gd4.style.width = width;
			ref.append(gd4);
			if (ehs) ref.append(ehs);
			document.activeElement.blur();
		} else {
			placeholder.style.cssText = `display: none;`;
			gd4.style.width = "";
			placeholder.after(gd4);
			if (ehs) ehsParent.append(ehs);
			components_Manga.focus();
		}
	}, { defer: true });
	components_Manga.setDefaultHotkeys((hotkeys) => ({
		...hotkeys,
		float_tag_list: ["q"]
	}));
	core.registerEsc("关闭浮动标签栏", () => store.open ? setState("open", false) : "SKIP");
	components_Manga.listenHotkey({ float_tag_list: () => {
		setState((state) => {
			state.open = !state.open;
			if (!state.open) return;
			setPos(state, state.mouse.y - gd4.clientHeight / 2, state.mouse.x - gd4.clientWidth / 2);
		});
	} });
	helper.hijackFn("tag_from_field", (rawFn, args) => {
		if (store.open) document.activeElement.blur();
		return rawFn(...args);
	});
	const { newTagField } = pageCtx.dom;
	newTagField.addEventListener("pointerenter", () => store.open && newTagField.focus());
	/** 根据标签链接获取对应的标签名 */
	const getDropTag = (tagUrl) => {
		const tagDom = helper.querySelector(`a[href=${CSS.escape(tagUrl)}]`);
		if (!tagDom) return;
		return tagDom.title || tagDom.id.slice(3).replaceAll("_", " ");
	};
	const handleDrop = (e) => {
		const text = e.dataTransfer.getData("text");
		const tag = getDropTag(text);
		if (!tag) return;
		e.preventDefault();
		if (!newTagField.value.includes(tag)) newTagField.value += `${tag}, `;
		newTagField.dispatchEvent(new Event("input"));
	};
	newTagField.addEventListener("drop", handleDrop);
	const taglist = helper.querySelector("#taglist");
	taglist.addEventListener("dragover", (e) => e.preventDefault());
	taglist.addEventListener("dragenter", (e) => e.preventDefault());
	taglist.addEventListener("drop", handleDrop);
};
//#endregion
//#region src/site/ehentai/helper/api.ts
const ehApi = async (data, details) => {
	const res = await request.request(`/api.php`, {
		fetch: false,
		method: "POST",
		responseType: "json",
		cookie: document.cookie,
		data: JSON.stringify(data),
		...details
	});
	if (res.response.error) {
		helper.log.error(res.response.error);
		throw new Error(res.response.error);
	}
	return res.response;
};
/** 使用 api 获取图片链接 */
const getImgUrlByApi = async (pageCtx, i, nextLink) => {
	const imgPageUrl = pageCtx.pageList[i];
	const { imgkey, gid, page, nl } = /\/s\/(?<imgkey>\S+)\/(?<gid>\d+)-(?<page>\d+)(?=$|\?nl=(?<nl>\d+))/u.exec(imgPageUrl).groups;
	const data = {
		gid,
		page,
		imgkey
	};
	if (nl) data.nl = nl;
	if (pageCtx.mpvkey) {
		const res = await ehApi({
			method: "imagedispatch",
			...data,
			mpvkey: pageCtx.mpvkey
		}, { noTip: true });
		if (nextLink) setNl(pageCtx, i, res.s);
		return res.i;
	}
	const res = await ehApi({
		method: "showpage",
		...data,
		showkey: pageCtx.showkey
	}, { noTip: true });
	if (nextLink) setNl(pageCtx, i, /nl\('(?<nl>\d+-\d+)'\)/u.exec(res.i3).groups.nl);
	return /src="(?<src>\S+)"/u.exec(res.i3).groups.src;
};
/** 检查 showkey */
const checkShowkey = async (pageCtx, imgPageUrl) => {
	if (pageCtx.showkey) return;
	const { responseText: html } = await request.request(imgPageUrl, { fetch: true }, 10);
	pageCtx.showkey = /showkey="(?<showkey>\S+)"/u.exec(html).groups.showkey;
};
/** 检查 mpvkey */
const checkMpvKey = async (pageCtx) => {
	if (pageCtx.mpvkey) return;
	const mpvUrl = `${location.origin}${location.pathname}`.replace("/g/", "/mpv/");
	if (!helper.querySelector(`.g2 a[href="${mpvUrl}"]`)) return;
	const { responseText: html } = await request.request(mpvUrl, { fetch: true });
	const mpvkey = /mpvkey = "(?<key>\S+)"/u.exec(html)?.groups?.key;
	if (!mpvkey) return;
	pageCtx.mpvkey = mpvkey;
};
/** 检查 IP 是否被封禁 */
const checkIpBanned = (text) => text.includes("IP address has been temporarily banned") && components_Toast.toast.error(helper.t("site.ehentai.ip_banned"), {
	throw: true,
	duration: Infinity
});
/** 从图片页获取图片地址 */
const getImgUrl = async (pageCtx, i) => {
	try {
		return await getImgUrlByApi(pageCtx, i);
	} catch (error) {
		helper.log.warn("getImgUrlByApi failed", error);
	}
	const res = await request.request(pageCtx.pageList[i], {
		fetch: true,
		errorText: helper.t("site.ehentai.fetch_img_page_source_failed")
	}, 10);
	checkIpBanned(res.responseText);
	try {
		return /id="img" src="(?<src>.+?)"/u.exec(res.responseText).groups.src;
	} catch {
		throw new Error(helper.t("site.ehentai.fetch_img_url_failed"));
	}
};
/** 从详情页获取图片页的地址 */
const getImgPageUrl = async (pageNum = 0) => {
	const res = await request.request(`${location.pathname}${pageNum ? `?p=${pageNum}` : ""}`, {
		fetch: true,
		errorText: helper.t("site.ehentai.fetch_img_page_url_failed")
	});
	checkIpBanned(res.responseText);
	const pageList = [...res.responseText.matchAll(/<a href="(?<url>.{20,50})"><(?<img>img alt=.+?|div><div |div )title=".+?: (?<fileName>.+?)"/gu)].map(({ groups: { url, fileName } }) => [url, fileName]);
	if (pageList.length === 0) throw new Error(helper.t("site.ehentai.fetch_img_page_url_failed"));
	return pageList;
};
/** 获取新的图片页地址 */
const updatePageUrl = async (pageCtx, i) => {
	try {
		return await getImgUrlByApi(pageCtx, i, true);
	} catch {}
	const res = await request.request(pageCtx.pageList[i], { errorText: helper.t("site.ehentai.fetch_img_page_source_failed") });
	checkIpBanned(res.responseText);
	const nl = /nl\('(?<nl>.+?)'\)/u.exec(res.responseText)?.groups?.nl;
	if (!nl) throw new Error(helper.t("site.ehentai.fetch_img_url_failed"));
	setNl(pageCtx, i, nl);
};
/** 按需加载第 i 张图所在分页的详情页 URL */
const ensureImgPageUrl = async (pageCtx, index) => {
	if (pageCtx.pageList[index]) return;
	const pageNum = Math.floor(index / pageCtx.imagesPerPage) || 0;
	const pageList = await getImgPageUrl(pageNum);
	pageCtx.imagesPerPage ||= pageList.length;
	const startIndex = pageNum * pageCtx.imagesPerPage;
	for (let i = 0; i < pageList.length; i++) [pageCtx.pageList[startIndex + i], pageCtx.fileNameList[startIndex + i]] = pageList[i];
};
//#endregion
//#region src/site/ehentai/hotkeys.ts
const addHotkeysActions = (_, pageCtx) => {
	if (pageCtx.type !== "gallery") return components_Manga.listenHotkey({
		scroll_right: () => helper.querySelector("#unext")?.click(),
		scroll_left: () => helper.querySelector("#uprev")?.click()
	});
	core.registerEsc("取消选中当前标签", () => unsafeWindow.selected_tagname ? unsafeWindow.toggle_tagmenu() : "SKIP");
	return components_Manga.listenHotkey({
		ArrowUp: () => unsafeWindow.selected_tagid && unsafeWindow?.tag_vote_up(),
		ArrowDown: () => unsafeWindow.selected_tagid && unsafeWindow?.tag_vote_down(),
		scroll_right: () => helper.querySelector(".ptt td:last-child:not(.ptdd)")?.click(),
		scroll_left: () => helper.querySelector(".ptt td:first-child:not(.ptdd)")?.click()
	});
};
//#endregion
//#region src/site/ehentai/detectAd.ts
const imageBitmapCache = /* @__PURE__ */ new Map();
const loadImageBitmap = async (url) => {
	if (imageBitmapCache.has(url)) return imageBitmapCache.get(url);
	const imageBitmap = await createImageBitmap(await request.downloadImg(url));
	imageBitmapCache.set(url, imageBitmap);
	return imageBitmap;
};
/** 从雪碧图中切割指定区域的图片 */
const extractSpriteImage = async (style) => {
	const { width, height, backgroundImage, backgroundPositionX: backgroundX, backgroundPositionY: backgroundY } = style;
	const urlMatch = /url\(['"](?<url>[^)]+)['"]\)/u.exec(backgroundImage)?.groups;
	if (!urlMatch) throw new Error("解析不到背景图片URL");
	const { url } = urlMatch;
	const spriteImage = await loadImageBitmap(url);
	const w = parseFloat(width);
	const h = parseFloat(height);
	const canvas = new OffscreenCanvas(w, h);
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, w, h);
	const sourceX = -parseFloat(backgroundX);
	const sourceY = -parseFloat(backgroundY);
	ctx.drawImage(spriteImage, sourceX, sourceY, w, h, 0, 0, w, h);
	return canvas.transferToImageBitmap();
};
/** 识别广告 */
const detectAd = ({ store, setState, options }, { imgList, pageList, fileNameList }) => {
	if (!(options.detect_ad && document.getElementById("ta_other:extraneous_ads"))) return;
	setState("imgListMap", "", "adList", new helper.ReactiveSet());
	/** 缩略图列表 */
	const thumbnailList = [];
	(async () => {
		for (const e of helper.querySelectorAll("#gdt > a")) {
			const index = Number(/.+-(?<index>\d+)/u.exec(e.href)?.groups?.index) - 1;
			if (Number.isNaN(index)) continue;
			pageList[index] = e.href;
			const thumbnail = e.querySelector("[title]");
			[, fileNameList[index]] = thumbnail.title.split(/：|: /u);
			if (helper.isImageElement(thumbnail)) thumbnailList[index] = thumbnail;
			if (thumbnail.style.background.includes("url(")) thumbnailList[index] = await extractSpriteImage(thumbnail.style);
		}
		await userscript_detectAd.getAdPageByFileName(fileNameList, store.imgListMap[""].adList);
		if (store.imgListMap[""].adList.size === 0) await userscript_detectAd.getAdPageByContent(thumbnailList, store.imgListMap[""].adList);
	})();
	helper.css(helper.createRootMemo(() => {
		if (!store.imgListMap[""]?.adList?.size) return "";
		return [...store.imgListMap[""].adList].map((i) => `a[href="${pageList[i]}"] [title]:not(:hover) {
              filter: blur(8px);
              clip-path: border-box;
              backdrop-filter: blur(8px);
            }`).join("\n");
	}));
	return {
		checkFileName: helper.once(() => userscript_detectAd.getAdPageByFileName(fileNameList, store.imgListMap[""].adList)),
		checkContent: helper.once(() => userscript_detectAd.getAdPageByContent(imgList, store.imgListMap[""].adList))
	};
};
//#endregion
//#region src/site/ehentai/multiSelectLoad.tsx
const multiSelectLoad = async (coreCtx, pageCtx) => {
	const { setState } = coreCtx;
	helper.css`
    #gdt > a [title] {
      position: relative;
    }
  `;
	const checkAd = detectAd(coreCtx, pageCtx);
	setState("manga", { onLoading: (_, img) => {
		if (!img) return;
		const index = pageCtx.imgList.indexOf(img.src);
		const { length } = pageCtx.imgList;
		if (helper.inRange(length - 10, index, length)) checkAd?.checkContent();
	} });
	const ensureSetup = helper.singleThreaded(async () => {
		await ensureImgPageUrl(pageCtx, 0);
		checkAd?.checkFileName();
		try {
			await checkMpvKey(pageCtx);
			await checkShowkey(pageCtx, pageCtx.pageList[0]);
		} catch (error) {
			helper.log.warn("checkKey failed", error);
		}
	});
	const ms = await core.useMultiSelectLoad(coreCtx, {
		id: pageCtx.galleryId,
		allItemIds: () => helper.range(pageCtx.imgNum).map(String),
		registerItems: (map) => {
			for (const dom of helper.querySelectorAll("#gdt a")) {
				const imgIndex = Number(/(?<=-)\d+(?:\?|$)/u.exec(dom.href)?.[0]) - 1;
				if (!Number.isNaN(imgIndex)) map.set(dom.querySelector("[title]"), String(imgIndex));
			}
		},
		getImgList: async (id) => {
			await ensureSetup();
			const i = Number(id);
			await ensureImgPageUrl(pageCtx, i);
			pageCtx.imgList[i] ||= await getImgUrl(pageCtx, i);
			return [{
				src: pageCtx.imgList[i],
				name: pageCtx.fileNameList[i]
			}];
		}
	});
	return { handleClick: async (e) => {
		if (!e.shiftKey) return;
		e.stopPropagation();
		const defaultValue = helper.descRange(ms.selectedIds().map(Number), pageCtx.imgNum);
		const [message, tip] = helper.t("other.page_range").split("\n");
		const pageRange = await components_InputDialog.askInput({
			message,
			tip,
			defaultValue
		});
		if (!pageRange) return;
		if (!ms.isEnabled()) ms.start();
		ms.setSelectedIds([...helper.extractRange(pageRange, pageCtx.imgNum)].map(String));
		await ms.load();
	} };
};
//#endregion
//#region src/site/ehentai/quickFavorite.tsx
var _tmpl$$5 = /*#__PURE__*/ solid_js_web.template(`<div>`);
var _tmpl$2$4 = /*#__PURE__*/ solid_js_web.template(`<div class=comidread-favorites-item><input type=radio>`);
var _tmpl$3$2 = /*#__PURE__*/ solid_js_web.template(`<span class=comidread-favorites>`);
var _tmpl$4$2 = /*#__PURE__*/ solid_js_web.template(`<h3>loading...`);
const style = `
  .comidread-favorites {
    position: absolute;
    z-index: 75;
    left: 0;

    overflow: auto;
    align-content: center;

    box-sizing: border-box;
    width: 100%;
    padding-left: 0.6em;

    border: none;
    border-radius: 0;
  }

  .comidread-favorites-item {
    cursor: pointer;

    display: flex;
    align-items: center;

    width: 100%;
    margin: 1em 0;

    text-align: left;
    overflow-wrap: anywhere;
  }

  .comidread-favorites-item > input {
    pointer-events: none;
    margin: 0 0.5em 0 0;
  }

  .comidread-favorites-item > div {
    flex-shrink: 0;

    width: 15px;
    height: 15px;
    margin: 0 0.5em 0 0;

    background-image: url("https://ehgt.org/g/fav.png");
    background-repeat: no-repeat;
  }

  .gl1t > .comidread-favorites {
    padding: 1em 1.5em;
  }

  .comidread-blink {
    animation: comidread-blink 1.2s ease-in-out infinite;
  }

  @keyframes comidread-blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.25;
    }
  }
`;
const addQuickFavorite = ({ button: favoriteButton, root, apiUrl, height, top = 0 }) => {
	root.style.position = "relative";
	const [show, setShow] = solid_js.createSignal(false);
	const [favorites, setFavorites] = solid_js.createSignal([]);
	const [favnote, setFavnote] = solid_js.createSignal("");
	const updateFavorite = async () => {
		try {
			const res = await core.request(apiUrl, { errorText: helper.t("site.ehentai.fetch_favorite_failed") });
			const dom = helper.domParse(res.responseText);
			const list = [...dom.querySelectorAll(".nosel > div")];
			if (list.length === 10) list[0].querySelector("input").checked = false;
			setFavnote(dom.querySelector("#galpop textarea[name=\"favnote\"]")?.value ?? "");
			setFavorites(list);
		} catch {
			core.toast.error(helper.t("site.ehentai.fetch_favorite_failed"));
			setFavorites([]);
		}
	};
	let hasRender = false;
	const renderDom = () => {
		if (hasRender) return;
		hasRender = true;
		const FavoriteItem = (e, index) => {
			const { checked } = e.querySelector("input");
			const handleClick = async () => {
				if (checked) return;
				setShow(false);
				const formData = new URLSearchParams();
				formData.append("favcat", index() === 10 ? "favdel" : `${index()}`);
				formData.append("apply", "Apply Changes");
				formData.append("favnote", favnote());
				formData.append("update", "1");
				favoriteButton.classList.add("comidread-blink");
				const res = await core.request(apiUrl, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					data: formData.toString(),
					errorText: helper.t("site.ehentai.change_favorite_failed")
				}).finally(() => favoriteButton.classList.remove("comidread-blink"));
				core.toast.success(helper.t("site.ehentai.change_favorite_success"));
				const updateCode = /\nif\(window.opener.document.+\n/u.exec(res.responseText)?.[0]?.replaceAll("window.opener.document", "window.document");
				if (updateCode) eval(updateCode);
				await updateFavorite();
			};
			return (() => {
				var _el$ = _tmpl$2$4(), _el$2 = _el$.firstChild;
				_el$.$$click = handleClick;
				_el$2.checked = checked;
				solid_js_web.insert(_el$, solid_js_web.createComponent(solid_js.Show, {
					get when() {
						return index() <= 9;
					},
					get children() {
						var _el$3 = _tmpl$$5();
						solid_js_web.effect((_$p) => solid_js_web.setStyleProperty(_el$3, "background-position", `0px -${2 + 19 * index()}px`));
						return _el$3;
					}
				}), null);
				solid_js_web.insert(_el$, () => e.textContent?.trim(), null);
				return _el$;
			})();
		};
		let background = "rgba(0, 0, 0, 0)";
		let dom = root;
		while (background === "rgba(0, 0, 0, 0)") {
			background = getComputedStyle(dom).backgroundColor;
			dom = dom.parentElement;
		}
		solid_js_web.render(() => solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return show();
			},
			get children() {
				var _el$4 = _tmpl$3$2();
				solid_js_web.setStyleProperty(_el$4, "background", background);
				solid_js_web.setStyleProperty(_el$4, "height", `${height}px`);
				solid_js_web.setStyleProperty(_el$4, "top", `${top}px`);
				solid_js_web.insert(_el$4, solid_js_web.createComponent(solid_js.For, {
					get each() {
						return favorites();
					},
					children: FavoriteItem,
					get fallback() {
						return _tmpl$4$2();
					}
				}));
				return _el$4;
			}
		}), root);
	};
	const rawClick = favoriteButton.onclick;
	favoriteButton.onclick = null;
	favoriteButton.addEventListener("mousedown", async (e) => {
		if (e.buttons !== 1 && e.buttons !== 4) return;
		e.stopPropagation();
		e.preventDefault();
		if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.buttons === 4) return rawClick.call(favoriteButton, e);
		renderDom();
		setShow((val) => !val);
		if (show()) await updateFavorite();
	});
};
/** 快捷收藏 */
const quickFavorite = (_, pageCtx) => {
	if (unsafeWindow.apiuid === -1) return;
	switch (pageCtx.type) {
		case "gallery":
			helper.css(style);
			addQuickFavorite({
				root: helper.querySelector("#gd3"),
				button: helper.querySelector("#gdf"),
				apiUrl: `${unsafeWindow.popbase}addfav`,
				height: helper.querySelector("#gdf").firstElementChild.offsetTop
			});
			break;
		case "t":
			helper.css(style);
			for (const item of helper.querySelectorAll(".gl1t")) {
				const button = item.querySelector("[id^=posted_]");
				const top = item.firstElementChild.getBoundingClientRect().bottom - item.getBoundingClientRect().top;
				const bottom = item.lastElementChild.getBoundingClientRect().top - item.getBoundingClientRect().top;
				const [apiUrl] = /http.+?(?=')/u.exec(button.getAttribute("onclick"));
				addQuickFavorite({
					root: item,
					top,
					height: bottom - top,
					button,
					apiUrl
				});
			}
			break;
		case "e":
			helper.css(style);
			for (const item of helper.querySelectorAll(".gl1e")) {
				const button = item.nextElementSibling.querySelector("[id^=posted_]");
				const height = Number.parseInt(getComputedStyle(item).height, 10);
				const [apiUrl] = /http.+?(?=')/u.exec(button.getAttribute("onclick"));
				addQuickFavorite({
					root: item,
					button,
					height,
					apiUrl
				});
			}
	}
};
solid_js_web.delegateEvents(["click"]);
//#endregion
//#region src/site/ehentai/quickRating.tsx
var _tmpl$$4 = /*#__PURE__*/ solid_js_web.template(`<span class=comidread-quick-rating><img src=https://ehgt.org/g/blank.gif><map>`);
var _tmpl$2$3 = /*#__PURE__*/ solid_js_web.template(`<area shape=rect>`);
/** 快捷评分 */
const quickRating = (_, pageCtx) => {
	let list;
	switch (pageCtx.type) {
		case "e":
			list = helper.querySelectorAll("#favform > table > tbody > tr");
			break;
		case "m":
		case "p":
		case "l":
			list = helper.querySelectorAll("#favform > table > tbody > tr").slice(1);
			break;
		case "t":
			list = helper.querySelectorAll(".gl1t");
			break;
		default: return;
	}
	helper.css`
    .comidread-quick-rating {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .comidread-blink {
      animation: comidread-blink 1.2s ease-in-out infinite;
    }

    @keyframes comidread-blink {
      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.25;
      }
    }
  `;
	const coordsList = [
		"0,0,7,16",
		"8,0,15,16",
		"16,0,23,16",
		"24,0,31,16",
		"32,0,39,16",
		"40,0,47,16",
		"48,0,55,16",
		"56,0,63,16",
		"64,0,71,16",
		"72,0,79,16"
	];
	/** 修改评分 */
	const editRating = async (url, num) => {
		try {
			const dataRes = await core.request(url, {
				errorText: helper.t("site.ehentai.change_rating_failed"),
				noTip: true
			});
			const match = /api_url = "(?<api_url>.+?)";.+?gid = (?<gid>\d+);.+?token = "(?<token>.+?)";.+?apiuid = (?<apiuid>\d+);.+?apikey = "(?<apikey>.+?)"/su.exec(dataRes.responseText)?.groups;
			if (!match) throw new Error(helper.t("site.ehentai.change_rating_failed"));
			const { api_url, gid, token, apiuid, apikey } = match;
			const res = await core.request(api_url, {
				method: "POST",
				responseType: "json",
				data: JSON.stringify({
					method: "rategallery",
					rating: `${num}`,
					apikey,
					apiuid,
					gid,
					token
				}),
				fetch: true,
				noTip: true
			});
			core.toast.success(`${helper.t("site.ehentai.change_rating_success")}: ${res.response.rating_usr}`);
			return res.response;
		} catch {
			core.toast.error(helper.t("site.ehentai.change_rating_failed"));
			throw new Error(helper.t("site.ehentai.change_rating_failed"));
		}
	};
	/** 根据评分修改显示效果 */
	const updateRatingImage = (dom, num) => {
		let a = Math.round(num + 1);
		const b = -80 + 16 * Math.ceil(a / 2);
		a = a % 2 === 1 ? -21 : -1;
		dom.style.backgroundPosition = `${b}px ${a}px`;
	};
	const renderQuickRating = (item, ir, index) => {
		let basePosition = ir.style.backgroundPosition;
		let isRequesting = false;
		solid_js_web.render(() => (() => {
			var _el$ = _tmpl$$4(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
			_el$.$$mouseout = () => {
				ir.style.backgroundPosition = basePosition;
			};
			solid_js_web.setAttribute(_el$, "data-index", index);
			solid_js_web.setAttribute(_el$2, "usemap", `#rating-${index}`);
			solid_js_web.setAttribute(_el$3, "name", `rating-${index}`);
			solid_js_web.insert(_el$3, solid_js_web.createComponent(solid_js.For, {
				each: coordsList,
				children: (coords, i) => (() => {
					var _el$4 = _tmpl$2$3();
					_el$4.$$click = async () => {
						if (isRequesting) return;
						isRequesting = true;
						ir.classList.add("comidread-blink");
						try {
							const res = await editRating(item.querySelector("a").href, i() + 1);
							ir.className = res.rating_cls;
							updateRatingImage(ir, res.rating_usr * 2 - 1);
							basePosition = ir.style.backgroundPosition;
						} catch {
							ir.style.backgroundPosition = basePosition;
						} finally {
							isRequesting = false;
							ir.classList.remove("comidread-blink");
						}
					};
					_el$4.$$mouseover = () => updateRatingImage(ir, i());
					solid_js_web.setAttribute(_el$4, "coords", coords);
					return _el$4;
				})()
			}));
			return _el$;
		})(), ir);
	};
	for (const [index, item] of list.entries()) {
		const ir = [...item.querySelectorAll(".ir")].at(-1);
		if (!ir) continue;
		ir.addEventListener("mouseenter", () => renderQuickRating(item, ir, index), { once: true });
	}
};
solid_js_web.delegateEvents([
	"mouseout",
	"mouseover",
	"click"
]);
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/launch.svg
var _tmpl$$3 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18 19H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h5c.55 0 1-.45 1-1s-.45-1-1-1H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6c0-.55-.45-1-1-1s-1 .45-1 1v5c0 .55-.45 1-1 1M14 4c0 .55.45 1 1 1h2.59l-9.13 9.13a.996.996 0 1 0 1.41 1.41L19 6.41V9c0 .55.45 1 1 1s1-.45 1-1V3h-6c-.55 0-1 .45-1 1">`);
var launch_default = (props = {}) => (() => {
	var _el$ = _tmpl$$3();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region src/site/ehentai/quickTagDefine.tsx
var _tmpl$$2 = /*#__PURE__*/ solid_js_web.template(`<h3>`);
var _tmpl$2$2 = /*#__PURE__*/ solid_js_web.template(`<h1><a target=_blank>`);
var _tmpl$3$1 = /*#__PURE__*/ solid_js_web.template(`<span id=comidread-tag-define>`);
var _tmpl$4$1 = /*#__PURE__*/ solid_js_web.template(`<h3>loading...`);
/** 快捷查看标签定义 */
const quickTagDefine = (_, pageCtx) => {
	if (pageCtx.type !== "gallery") return;
	const tagContent = solid_js_store.createMutable({});
	const saveTagContent = async (tag) => {
		if (Reflect.has(tagContent, tag)) return;
		const url = `https://ehwiki.org/wiki/${tag.replaceAll(/[a-z]+:\s?/giu, "")}`;
		const res = await core.request(url, { noCheckCode: true });
		if (res.status !== 200) {
			tagContent[tag] = (() => {
				var _el$ = _tmpl$$2();
				solid_js_web.insert(_el$, () => `${res.status} - ${res.statusText}`);
				return _el$;
			})();
			return;
		}
		const content = helper.domParse(res.responseText).querySelector("#mw-content-text");
		for (const dom of content.querySelectorAll("img[src^=\"/\"]")) dom.setAttribute("src", `https://ehwiki.org${dom.getAttribute("src")}`);
		for (const dom of content.getElementsByTagName("a")) {
			const href = dom.getAttribute("href") ?? "";
			if (href.startsWith("/")) dom.setAttribute("href", `https://ehwiki.org${href}`);
			dom.target = "_blank";
		}
		for (const dom of content.querySelectorAll(".thumb")) dom.remove();
		tagContent[tag] = [(() => {
			var _el$2 = _tmpl$2$2(), _el$3 = _el$2.firstChild;
			solid_js_web.setAttribute(_el$3, "href", url);
			solid_js_web.insert(_el$3, tag, null);
			solid_js_web.insert(_el$3, solid_js_web.createComponent(launch_default, {}), null);
			return _el$2;
		})(), content];
	};
	helper.css`
    #comidread-tag-define {
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;

      box-sizing: border-box;
      width: 100%;
      padding: 0 1em;

      text-align: start;
    }

    #taglist {
      position: relative;
    }

    #comidread-tag-define h1 {
      margin: 0.4em 0;
      border-bottom: 1px solid #a2a9b1;
    }

    #comidread-tag-define h1 svg {
      height: 0.7em;
      margin-left: 0.2em;
    }

    #comidread-tag-define ul {
      margin: 0.3em 0 0 1.6em;
      padding: 0;
    }

    #comidread-tag-define li {
      margin-bottom: 0.2em;
    }

    #comidread-tag-define div a {
      text-decoration: underline;
    }

    #comidread-tag-define dd {
      margin-left: 1.6em;
    }

    #comidread-tag-define dl {
      margin-top: 0.2em;
      margin-bottom: 0.5em;
    }
  `;
	const [show, setShow] = solid_js.createSignal(false);
	const root = helper.querySelector("#taglist");
	let background = "rgba(0, 0, 0, 0)";
	let dom = root;
	while (background === "rgba(0, 0, 0, 0)") {
		background = getComputedStyle(dom).backgroundColor;
		dom = dom.parentElement;
	}
	solid_js_web.render(() => solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return show();
		},
		get children() {
			var _el$4 = _tmpl$3$1();
			solid_js_web.setStyleProperty(_el$4, "background", background);
			solid_js_web.insert(_el$4, () => tagContent[unsafeWindow.selected_tagname] ?? _tmpl$4$1());
			solid_js_web.effect((_$p) => solid_js_web.setStyleProperty(_el$4, "height", `${root.scrollHeight}px`));
			return _el$4;
		}
	}), root);
	unsafeWindow.tag_define = async () => {
		if (!unsafeWindow.selected_tagname) return;
		if (show()) return setShow(false);
		setShow(true);
		try {
			await saveTagContent(unsafeWindow.selected_tagname);
		} catch (error) {
			helper.log.error(error);
			setShow(false);
		}
	};
	helper.hijackFn("toggle_tagmenu", () => setShow(false));
	core.registerEsc("关闭显示标签定义", () => show() ? setShow(false) : "SKIP");
};
//#endregion
//#region src/site/ehentai/sidebarOverflow.ts
/** 处理侧边栏溢出 */
const sidebarOverflow = (_, pageCtx) => {
	if (pageCtx.type !== "gallery") return;
	const { sidebar } = pageCtx.dom;
	new ResizeObserver(() => {
		Reflect.deleteProperty(sidebar.dataset, "long");
		const lastNode = helper.querySelector("#gd5 p:last-of-type");
		if (lastNode.offsetTop + lastNode.offsetHeight > 352) sidebar.dataset.long = "";
	}).observe(sidebar);
	helper.css`
    #gd5[data-long] {
      --scrollbar-slider: ${getComputedStyle(helper.querySelector(".gm")).borderColor};

      scrollbar-color: var(--scrollbar-slider) transparent;
      scrollbar-width: thin;
      overflow: auto;
      max-height: 352px;

      &::-webkit-scrollbar {
        width: 5px;
        height: 10px;
      }

      &::-webkit-scrollbar-track {
        background: transparent;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-slider);
      }
    }

    /* 在显示 ehs 时隐藏 gd5 上的滚动条，避免同时显示两个滚动条 */
    #gd5[data-long]:has(#ehs-introduce-box .ehs-content) {
      overflow: hidden;
    }

    #gmid #ehs-introduce-box {
      width: 100%;
    }

    /*
      消除 ehs 针对按钮太多时的解决办法，用脚本的处理方式就好了，避免在浮动标签栏时导致滚动
      https://github.com/EhTagTranslation/EhSyringe/commit/009054cc34ee818972d2a042990bf89bdff1895a
    */
    body #gmid #gd5 {
      --ehs-gap: 1;

      justify-content: unset;
    }
  `;
};
//#endregion
//#region src/site/ehentai/tagLint.tsx
var _tmpl$$1 = /*#__PURE__*/ solid_js_web.template(`<div><a>`);
var _tmpl$2$1 = /*#__PURE__*/ solid_js_web.template(`<span>「<!>」`);
var _tmpl$3 = /*#__PURE__*/ solid_js_web.template(`<li>`);
var _tmpl$4 = /*#__PURE__*/ solid_js_web.template(`<hr>`);
var _tmpl$5 = /*#__PURE__*/ solid_js_web.template(`<ul>`);
const tagLint = (_, pageCtx) => {
	if (pageCtx.type !== "gallery") return;
	/** 是否是「Doujinshi」「Manga」「Non-H」 */
	const isManga = isInCategories("Doujinshi", "Manga", "Non-H");
	const lintRules = userscript_ehTagRules.getTagLintRules();
	const [warnList, setWarnList] = solid_js.createSignal({});
	helper.css`
    #comidread-tag-lint [id^='td_'] {
      float: none;
      display: inline-block;
    }
  `;
	const getTagClass = (tag, weak) => {
		if (weak === void 0) return document.getElementById(`td_${tag}`)?.className;
		return weak ? "gtl" : "gt";
	};
	const TagBase = (props) => (() => {
		var _el$ = _tmpl$$1(), _el$2 = _el$.firstChild;
		_el$2.$$click = (e) => e.preventDefault();
		solid_js_web.insert(_el$2, () => props.name);
		solid_js_web.effect((_p$) => {
			var _v$ = `td_${props.name}`, _v$2 = getTagClass(props.name, props.weak), _v$3 = `ta_${props.name}`, _v$4 = `https://exhentai.org/tag/${props.name.replaceAll("_", "+")}`;
			_v$ !== _p$.e && solid_js_web.setAttribute(_el$, "id", _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.className(_el$, _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$2, "id", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$2, "href", _p$.o = _v$4);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0
		});
		return _el$;
	})();
	const Tag = (props) => {
		const tags = userscript_ehTagRules.splitTagNamespace(props.name);
		return solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return tags.length > 1;
			},
			get fallback() {
				return TagBase(props);
			},
			get children() {
				var _el$3 = _tmpl$2$1(), _el$6 = _el$3.firstChild.nextSibling;
				_el$6.nextSibling;
				solid_js_web.insert(_el$3, solid_js_web.createComponent(solid_js.For, {
					each: tags,
					children: (name, i) => [solid_js_web.memo(() => solid_js_web.memo(() => !!i())() ? ` ${helper.t("other.or")} ` : ""), solid_js_web.createComponent(TagBase, {
						name,
						get weak() {
							return props.weak;
						}
					})]
				}), _el$6);
				return _el$3;
			}
		});
	};
	const WarnItem = (props) => {
		const [before, middle, after] = props.text.split("[tag]");
		return solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return props.warnList?.size;
			},
			get children() {
				return solid_js_web.createComponent(solid_js.For, {
					get each() {
						return [...props.warnList.entries()];
					},
					children: ([tag, tags]) => (() => {
						var _el$7 = _tmpl$3();
						solid_js_web.insert(_el$7, before, null);
						solid_js_web.insert(_el$7, solid_js_web.createComponent(Tag, { name: tag }), null);
						solid_js_web.insert(_el$7, middle, null);
						solid_js_web.insert(_el$7, solid_js_web.createComponent(solid_js.For, {
							each: tags,
							children: (tagName) => solid_js_web.createComponent(Tag, {
								name: tagName,
								get weak() {
									return props.weak;
								}
							})
						}), null);
						solid_js_web.insert(_el$7, after, null);
						return _el$7;
					})()
				});
			}
		});
	};
	let root;
	let dispose;
	const updateLint = helper.singleThreaded(() => {
		const newWarnList = {};
		const [lockTags, weakTags] = getTaglist();
		const tagList = /* @__PURE__ */ new Set([...lockTags, ...weakTags]);
		/** 根据指定规则检查标签并记录 */
		const checkRules = (tag, ruleName, has = false) => {
			const rules = lintRules[ruleName];
			if (!rules.has(tag)) return;
			for (const targetTag of rules.get(tag)) {
				if (userscript_ehTagRules.hasTag(has ? lockTags : tagList, targetTag) === has) continue;
				newWarnList[ruleName] ??= /* @__PURE__ */ new Map([[tag, []]]);
				const warn = newWarnList[ruleName];
				if (!warn.has(tag)) warn.set(tag, []);
				warn.get(tag).push(targetTag);
			}
		};
		for (const tag of tagList) {
			checkRules(tag, "prerequisite", true);
			checkRules(tag, "conflict");
			if (isManga) checkRules(tag, "possibleConflict");
			checkRules(tag, "combo", true);
		}
		const addOtherWarn = (text, tags) => {
			newWarnList.other ??= [];
			newWarnList.other.push([text, tags]);
		};
		const correctTags = [];
		for (const tag of weakTags) if (/^(?:artist|group):/u.test(tag)) {
			const title = helper.querySelector("#gd2").textContent.toLowerCase();
			if (title.includes(tag.replaceAll(/^(?<_>artist|group):|_/gu, " ").trim())) correctTags.push(tag);
			else {
				const showName = document.getElementById(`ta_${tag}`)?.textContent;
				if (showName && title.includes(showName)) correctTags.push(tag);
			}
		}
		if (correctTags.length > 0) addOtherWarn(helper.t("eh_tag_lint.correct_tag"), correctTags);
		if (isInCategories("Doujinshi") && userscript_ehTagRules.isMissingNamespace(tagList, "parody")) addOtherWarn(helper.t("eh_tag_lint.miss_parody"), ["parody:original"]);
		if (isManga && userscript_ehTagRules.isMissingTags(lockTags, "female:females_only", "female:futanari", "female:shemale") && userscript_ehTagRules.isMissingNamespace(tagList, "male", "mixed")) addOtherWarn(helper.t("eh_tag_lint.miss_female"), ["female:females_only"]);
		setWarnList(newWarnList);
		if (!root?.isConnected) {
			root = document.createElement("div");
			root.id = "comidread-tag-lint";
			helper.querySelector("#taglist").append(root);
		}
		dispose?.();
		dispose = solid_js_web.render(() => solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return Object.keys(warnList()).length;
			},
			get children() {
				return [_tmpl$4(), (() => {
					var _el$9 = _tmpl$5();
					solid_js_web.insert(_el$9, solid_js_web.createComponent(solid_js.For, {
						get each() {
							return warnList().other;
						},
						children: ([text, tags]) => (() => {
							var _el$0 = _tmpl$3();
							solid_js_web.insert(_el$0, text, null);
							solid_js_web.insert(_el$0, solid_js_web.createComponent(solid_js.For, {
								each: tags,
								children: (tagName) => solid_js_web.createComponent(Tag, {
									name: tagName,
									weak: true
								})
							}), null);
							return _el$0;
						})()
					}), null);
					solid_js_web.insert(_el$9, solid_js_web.createComponent(WarnItem, {
						get warnList() {
							return warnList().prerequisite;
						},
						get text() {
							return helper.t("eh_tag_lint.prerequisite");
						},
						weak: false
					}), null);
					solid_js_web.insert(_el$9, solid_js_web.createComponent(WarnItem, {
						get warnList() {
							return warnList().conflict;
						},
						get text() {
							return helper.t("eh_tag_lint.conflict");
						}
					}), null);
					solid_js_web.insert(_el$9, solid_js_web.createComponent(WarnItem, {
						get warnList() {
							return warnList().possibleConflict;
						},
						get text() {
							return helper.t("eh_tag_lint.possible_conflict");
						}
					}), null);
					solid_js_web.insert(_el$9, solid_js_web.createComponent(WarnItem, {
						get warnList() {
							return warnList().combo;
						},
						get text() {
							return helper.t("eh_tag_lint.combo");
						},
						weak: true
					}), null);
					return _el$9;
				})()];
			}
		}), root);
	});
	updateLint();
	helper.hijackFn("tag_update_vote", updateLint);
	const [inputTagList, setInputTagList] = helper.createEqualsSignal([]);
	helper.css(helper.createRootMemo(() => inputTagList().map((tag) => `#td_${CSS.escape(tag.replaceAll(" ", "_"))} { box-shadow: 0px 0px 4px var(--tag); }`).join("\n")));
	const { newTagField } = pageCtx.dom;
	const updateInputTagList = () => setInputTagList(newTagField.value.split(",").map((tag) => getTagNameFull(tag.trim())).filter(Boolean));
	newTagField.addEventListener("input", updateInputTagList);
	newTagField.addEventListener("keydown", updateInputTagList);
	helper.hijackFn("tag_update_vote", updateInputTagList);
};
solid_js_web.delegateEvents(["click"]);
//#endregion
//#region src/site/ehentai/index.tsx
var _tmpl$ = /*#__PURE__*/ solid_js_web.template(`<hr>`);
var _tmpl$2 = /*#__PURE__*/ solid_js_web.template(`<p class="g2 gsp"style=padding-bottom:0><img src=https://ehgt.org/g/mr.gif>`);
core.setupSiteAdapter({
	name: "ehentai",
	options: featureOptions,
	getPageContext,
	handlers: {
		all: ({ setState, setOptions, options }) => {
			const SiteSettings = () => [
				solid_js_web.createComponent(solid_js.For, {
					each: [
						"colorize_tag",
						"float_tag_list",
						"expand_tag_list",
						"tag_lint",
						"",
						"quick_favorite",
						"quick_rating",
						"quick_tag_define",
						"",
						"cross_site_link",
						"detect_ad",
						"add_hotkeys_actions",
						"auto_adjust_option"
					],
					children: (name) => solid_js_web.createComponent(solid_js.Show, {
						when: name,
						get fallback() {
							return _tmpl$();
						},
						get children() {
							return solid_js_web.createComponent(components_Manga.SettingsItemSwitch, {
								get name() {
									return helper.t(`site.add_feature.${name}`);
								},
								get value() {
									return options[name];
								},
								onChange: (v) => setOptions({ [name]: v })
							});
						}
					})
				}),
				_tmpl$(),
				solid_js_web.createComponent(components_Manga.SettingBlockSubtitle, { get children() {
					return helper.t("other.hotkeys");
				} }),
				solid_js_web.createComponent(components_Manga.SettingHotkeys, { keys: ["float_tag_list"] })
			];
			setState((state) => {
				state.manga.editSettingList = (list) => [...list, ["E-Hentai", SiteSettings]];
				state.fab.optionsSpeedDial = [
					"tag_lint",
					"colorize_tag",
					"cross_site_link",
					"detect_ad"
				];
			});
			core.setEscPriority([
				"关闭显示标签定义",
				"取消选中当前标签",
				"关闭浮动标签栏"
			]);
		},
		mpv: ({ setState }) => {
			setState("imgListMap", "", { getImgList({ dynamicLazyLoad }) {
				const imagelist = unsafeWindow.imagelist;
				const loadImg = async (i) => {
					const url = () => imagelist[i].i;
					while (!url()) {
						if (!Reflect.has(imagelist[i], "xhr")) {
							unsafeWindow.load_image(i + 1);
							unsafeWindow.next_possible_request = 0;
						}
						await helper.wait(url);
					}
					return url();
				};
				return dynamicLazyLoad({
					loadImg,
					length: imagelist.length
				});
			} });
		},
		gallery: async (coreCtx, pageCtx) => {
			if (Number.isNaN(pageCtx.imgNum)) return core.toast.error(helper.t("site.changed_load_failed"));
			const { newTagField, sidebar } = pageCtx.dom;
			newTagField.addEventListener("keydown", (e) => e.key === "Escape" && newTagField.blur());
			const { setState, options } = coreCtx;
			sidebarOverflow(coreCtx, pageCtx);
			const { handleClick } = await multiSelectLoad(coreCtx, pageCtx);
			solid_js_web.render(() => {
				const hasMultiPage = sidebar.children[6]?.classList.contains("gsp");
				return (() => {
					var _el$3 = _tmpl$2();
					_el$3.firstChild;
					solid_js_web.setStyleProperty(_el$3, "padding-top", hasMultiPage ? 0 : void 0);
					_el$3.addEventListener("click", handleClick, true);
					solid_js_web.insert(_el$3, solid_js_web.createComponent(LoadButton, {
						id: "",
						context: coreCtx,
						get imgNum() {
							return pageCtx.imgNum;
						}
					}), null);
					return _el$3;
				})();
			}, sidebar);
			/** 刷新指定图片 */
			const reloadImg = helper.singleThreaded(async (_, url) => {
				const i = pageCtx.imgList.indexOf(url);
				if (i === -1) return;
				pageCtx.imgList[i] = await getImgUrl(pageCtx, i);
				if (!await helper.testImgUrl(pageCtx.imgList[i])) {
					await updatePageUrl(pageCtx, i);
					pageCtx.imgList[i] = await getImgUrl(pageCtx, i);
					core.toast.warn(helper.t("alert.retry_get_img_url", { i }));
					if (!await helper.testImgUrl(pageCtx.imgList[i])) {
						await helper.sleep(500);
						return reloadImg(url);
					}
				}
				setState("imgListMap", "", "imgList", i, pageCtx.imgList[i]);
				for (const img of components_Manga.imgList()) if (img.loadType === "error") return reloadImg(img.src);
			});
			setState((state) => {
				state.manga.title = pageCtx.japanTitle || pageCtx.galleryTitle;
				state.manga.onExit = (isEnd) => {
					if (isEnd) helper.scrollIntoView("#cdiv");
					setState("manga", "show", false);
				};
				state.manga.onImgError = reloadImg;
				state.fab.initialShow = options.autoShow;
			});
		}
	},
	features: {
		colorize_tag: colorizeTag,
		quick_favorite: quickFavorite,
		quick_rating: quickRating,
		expand_tag_list: expandTagList,
		add_hotkeys_actions: addHotkeysActions,
		float_tag_list: floatTagList,
		quick_tag_define: quickTagDefine,
		tag_lint: tagLint,
		cross_site_link: crossSiteLink,
		auto_adjust_option: ({ setState }, pageCtx) => {
			if (pageCtx.type !== "gallery") return;
			if (isInCategories("Doujinshi", "Manga", "Non-H")) return;
			setState((state) => {
				const option = { pageNum: 1 };
				state.manga.defaultOption = helper.assign(state.manga.defaultOption ?? {}, option);
				state.manga.option = helper.assign(state.manga.option ?? {}, option);
			});
		}
	}
});
//#endregion
