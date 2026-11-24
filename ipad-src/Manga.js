
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let solid_js_web = require("solid-js/web");
let helper = require("helper");
let solid_js = require("solid-js");
let solid_js_store = require("solid-js/store");
let request = require("request");
let comlink = require("comlink");
comlink = __toESM(comlink, 1);
let worker_ImageRecognition = require("worker/ImageRecognition");
worker_ImageRecognition = __toESM(worker_ImageRecognition, 1);
let components_Toast = require("components/Toast");
let components_InputDialog = require("components/InputDialog");
let worker_ImageUpscale = require("worker/ImageUpscale");
worker_ImageUpscale = __toESM(worker_ImageUpscale, 1);
let components_IconButton = require("components/IconButton");
let fflate = require("fflate");
let userscript_supportWorker = require("userscript/supportWorker");
//#region src/components/Manga/store/image.ts
const imgState = {
	imgMap: {},
	imgList: [],
	pageList: [],
	fillEffect: { "-1": true },
	showRange: [0, 0],
	renderRange: [0, 0],
	loadingRange: [0, 0],
	/**
	* 图片显示状态
	*
	* 0 - 页面中的第一张图片
	* 1 - 页面中的最后一张图片
	* '' - 页面中的唯一一张图片
	*/
	imgShowState: {},
	defaultImgType: ""
};
//#endregion
//#region src/components/Manga/actions/translation/translator/MangaImageTranslator/options.ts
/**
* MangaImageTranslator 翻译服务配置选项
*/
/**
* 默认配置
*
* 部分参数使用文档推荐值:
* @see https://github.com/zyddnys/manga-image-translator?tab=readme-ov-file#recommended-options
*/
const mitDefaultOptions = () => ({
	localUrl: void 0,
	detector: {
		detector: "ctd",
		detection_size: "1536",
		box_threshold: .7,
		unclip_ratio: 2.3
	},
	render: { direction: "auto" },
	translator: {
		translator: "gpt3.5",
		target_lang: {
			zh: "CHS",
			en: "ENG",
			ru: "RUS"
		}[helper.lang()] ?? "CHS"
	},
	inpainter: {
		inpainter: "lama_large",
		inpainting_size: "2048"
	},
	mask_dilation_offset: 30
});
/** 分辨率映射 */
const sizeDict = {
	"1024": "S",
	"1536": "M",
	"2048": "L",
	"2560": "X"
};
/** 目标语言选项 */
const targetLanguageOptions = [
	["CHS", "简体中文"],
	["CHT", "繁體中文"],
	["JPN", "日本語"],
	["ENG", "English"],
	["KOR", "한국어"],
	["VIN", "Tiếng Việt"],
	["CSY", "čeština"],
	["NLD", "Nederlands"],
	["FRA", "français"],
	["DEU", "Deutsch"],
	["HUN", "magyar nyelv"],
	["ITA", "italiano"],
	["PLK", "polski"],
	["PTB", "português"],
	["ROM", "limba română"],
	["RUS", "русский язык"],
	["ESP", "español"],
	["TRK", "Türk dili"],
	["IND", "Indonesia"]
];
//#endregion
//#region src/components/Manga/actions/translation/translator/Cotrans/options.ts
/**
* Cotrans 翻译服务配置选项
*/
/** Cotrans 支持的翻译器列表 */
const cotransTranslators = [
	"google",
	"youdao",
	"baidu",
	"deepl",
	"gpt3.5",
	"offline",
	"none"
];
/** Cotrans 默认配置 */
const cotransDefaultOptions = () => ({
	detector: {
		detector: "ctd",
		detection_size: "1536"
	},
	render: { direction: "auto" },
	translator: {
		translator: "gpt3.5",
		target_lang: {
			zh: "CHS",
			en: "ENG",
			ru: "RUS"
		}[helper.lang()] ?? "CHS"
	}
});
//#endregion
//#region src/components/Manga/store/option.ts
const _defaultOption = {
	dir: "rtl",
	scrollbar: {
		position: "auto",
		autoHidden: false,
		showImgStatus: true,
		easyScroll: false
	},
	clickPageTurn: {
		enabled: "ontouchstart" in document.documentElement,
		reverse: false,
		area: "left_right",
		shrinkMenu: false
	},
	firstPageFill: true,
	disableZoom: false,
	darkMode: void 0,
	swapPageTurnKey: false,
	scroolEnd: "auto",
	alwaysLoadAllImg: false,
	showComment: true,
	preloadPageNum: 20,
	pageNum: 0,
	pageTip: "auto",
	turnPageDuration: 0,
	scrollDuration: 100,
	autoSwitchPageMode: true,
	autoHiddenMouse: true,
	autoFullscreen: false,
	zoom: {
		ratio: 100,
		offset: {
			x: 0,
			y: 0
		}
	},
	scrollMode: {
		enabled: false,
		spacing: 0,
		imgScale: 1,
		adjustToWidth: "disable",
		abreastMode: false,
		abreastDuplicate: .1,
		pageColumns: 1,
		doubleMode: false,
		alignEdge: false
	},
	imgFilter: {
		brightness: 100,
		contrast: 100,
		saturate: 100
	},
	imgRecognition: {
		enabled: false,
		background: false,
		pageFill: true,
		upscale: false,
		crop: false,
		keepMargin: 10
	},
	translation: {
		enabled: false,
		provider: "manga-image-translator",
		onlyDownloadTranslated: false,
		forceRetry: false,
		mit: mitDefaultOptions(),
		cotrans: cotransDefaultOptions()
	},
	autoScroll: {
		enabled: false,
		interval: 16,
		distance: 1,
		continuous: true,
		triggerEnd: false
	}
};
const defaultOption = () => structuredClone(_defaultOption);
const optionState = {
	defaultOption: defaultOption(),
	option: defaultOption()
};
//#endregion
//#region src/components/Manga/store/other.ts
const otherState = {
	/** 漫画标题 */
	title: "",
	/**
	* 用于防止滚轮连续滚动导致过快触发事件的锁
	*
	* - 在首次触发结束页时开启，一段时间关闭。开启时禁止触发结束页的上下话切换功能。
	*/
	scrollLock: false,
	/** 当前是否处于全屏状态 */
	fullscreen: false,
	rootSize: {
		width: 0,
		height: 0
	},
	scrollbarSize: {
		width: 0,
		height: 0
	},
	/** 卷轴模式下的滚动距离 */
	scrollTop: 0,
	/** 虚拟棘轮的翻页进度（0~1），正为向下滚动 */
	wheelProgress: 0,
	/** 最近一次判定的滚动设备类型 */
	scrollDeviceType: void 0,
	autoScroll: {
		play: false,
		progress: 0
	},
	supportUpscaleImage: true
};
//#endregion
//#region src/components/Manga/store/prop.ts
const propState = {
	commentList: void 0,
	hotkeys: {},
	prop: {
		onExit: void 0,
		onPrev: void 0,
		onNext: void 0,
		onLoading: void 0,
		onOptionChange: void 0,
		onHotkeysChange: void 0,
		editButtonList: (list) => list,
		editSettingList: (list) => list
	}
};
//#endregion
//#region src/components/Manga/store/show.ts
const showState = {
	isMobile: false,
	isDragMode: false,
	isTurnAnimating: false,
	isScrollbarHover: false,
	activePageIndex: 0,
	show: {
		toolbar: false,
		scrollbar: false,
		pageTip: false,
		touchArea: false,
		endPage: void 0
	},
	page: {
		anima: "",
		vertical: true,
		offset: {
			x: {
				pct: 0,
				px: 0
			},
			y: {
				pct: 0,
				px: 0
			}
		}
	}
};
//#endregion
//#region src/components/Manga/store/index.ts
const initStore = {
	...imgState,
	...showState,
	...propState,
	...optionState,
	...otherState
};
const { store, setState } = helper.useStore({ ...initStore });
const refs = {
	root: void 0,
	mangaBox: void 0,
	mangaFlow: void 0,
	touchArea: void 0,
	scrollbar: void 0,
	settingPanel: void 0,
	prev: void 0,
	next: void 0,
	exit: void 0,
	/** 以图片原始 URL 为 key 的 img 元素集合，用于绕过 DOM 查询直接获取图片元素 */
	imgEleMap: {}
};
//#endregion
//#region src/components/Manga/handleComicData.ts
/** 判断图片是否是跨页图 */
const isWideImg = (img) => {
	switch (img.type ?? store.defaultImgType) {
		case "long":
		case "wide": return true;
		default: return false;
	}
};
/** 根据填充页设置双页排列单页图片 */
const arrangeImg = (pageList, fill) => {
	if (pageList.length === 0) return [];
	const newPageList = [];
	let imgCache = fill ? [-1] : [];
	for (const i of pageList) {
		imgCache.push(i);
		if (imgCache.length === 2) {
			newPageList.push(imgCache);
			imgCache = [];
		}
	}
	if (imgCache.length === 1 && imgCache[0] !== -1) {
		imgCache.push(-1);
		newPageList.push(imgCache);
	}
	return newPageList;
};
/** 计算指定图片流中的左右页位置正确的页数 */
const computeAccuracy = (imgList, pageList) => {
	let accuracy = 0;
	for (const [a, b] of pageList) {
		if ((imgList[a]?.blankMargin?.left ?? 0) > .04) accuracy += 1;
		if (b === void 0) break;
		if ((imgList[b]?.blankMargin?.right ?? 0) > .04) accuracy += 1;
	}
	return accuracy;
};
/** 自动切换填充页设置到左右页正确率更高的情况 */
const arrangePage = (pageList, { imgList, fillEffect, nowFillIndex, switchFill }) => {
	const fill = Boolean(fillEffect[nowFillIndex]);
	const newPageList = arrangeImg(pageList, fill);
	if (!switchFill || typeof fillEffect[nowFillIndex] === "number") return newPageList;
	const anotherPageList = arrangeImg(pageList, !fill);
	const anotherAccuracy = computeAccuracy(imgList, anotherPageList);
	if (anotherAccuracy === 0) return newPageList;
	if (anotherAccuracy <= computeAccuracy(imgList, newPageList)) return newPageList;
	helper.log(`${nowFillIndex} 自动切换页面填充`);
	fillEffect[nowFillIndex] = !fill;
	return anotherPageList;
};
/** 根据图片比例和填充页设置对漫画图片进行排列 */
const handleComicData = (imgList, fillEffect, switchFill) => {
	const context = {
		imgList,
		fillEffect,
		nowFillIndex: -1,
		switchFill
	};
	const pageList = [];
	const cacheList = [];
	for (let i = 0; i < imgList.length; i += 1) {
		const img = imgList[i];
		if (!isWideImg(img)) {
			cacheList.push(i);
			if (Reflect.has(fillEffect, i)) Reflect.deleteProperty(fillEffect, i);
			continue;
		}
		if (typeof fillEffect[context.nowFillIndex] === "boolean" && i < imgList.length - 2 && (cacheList.length + (fillEffect[context.nowFillIndex] ? 1 : 0)) % 2 === 1) {
			fillEffect[context.nowFillIndex] = !fillEffect[context.nowFillIndex];
			return handleComicData(imgList, fillEffect, switchFill);
		}
		pageList.push(...arrangePage(cacheList, context), [i]);
		cacheList.length = 0;
		if (fillEffect[i] === void 0) fillEffect[i] = false;
		context.nowFillIndex = i;
	}
	if (cacheList.length > 0) pageList.push(...arrangePage(cacheList, context));
	return pageList;
};
//#endregion
//#region src/components/Manga/actions/memo/img.ts
const imgList = helper.createRootMemo(() => store.imgList.map((url) => store.imgMap[url]));
/** 图片 url 对应的索引 */
const imgIndexMap = helper.createRootMemo(() => {
	const map = /* @__PURE__ */ new Map();
	for (const [index, url] of store.imgList.entries()) {
		const indexList = map.get(url);
		if (indexList) indexList.push(index);
		else map.set(url, [index]);
	}
	return map;
});
/** 当前显示页面 */
const activePage = helper.createRootMemo(() => store.pageList[store.activePageIndex] ?? []);
/** 当前显示的第一张图片的 index */
const activeImgIndex = helper.createRootMemo(() => activePage().find((i) => i !== -1) ?? 0);
/** 找到指定页面所处的图片流 */
const findFillIndex = (pageIndex, fillEffect) => {
	let nowFillIndex = pageIndex;
	while (!Reflect.has(fillEffect, nowFillIndex)) nowFillIndex -= 1;
	return nowFillIndex;
};
/** 当前所处的图片流 */
const nowFillIndex = helper.createRootMemo(() => findFillIndex(activeImgIndex(), store.fillEffect));
/** 预加载页数 */
const preloadNum = helper.createRootMemo(() => ({
	back: store.option.preloadPageNum,
	front: Math.floor(store.option.preloadPageNum / 2)
}));
/** 获取图片列表中指定属性的中位数 */
const getImgMedian = (sizeFn) => {
	const list = imgList().filter((img) => img.loadType === "loaded" && img.width).map(sizeFn).toSorted((a, b) => a - b);
	if (list.length < 3) return null;
	return list[Math.floor(list.length / 2)];
};
/** 图片占位尺寸 */
const placeholderSize = helper.createThrottleMemo(() => ({
	width: getImgMedian((img) => img.width) ?? 800,
	height: getImgMedian((img) => img.height) ?? 1200
}), 500);
//#endregion
//#region src/components/Manga/actions/helper.ts
const getImg = (i, state = store) => state.imgMap[state.imgList[i]];
/** 找到指定 url 图片在 imgList 里的 index */
const getImgIndexs = (url) => imgIndexMap().get(url) ?? [];
/** 找到指定 url 图片的 dom */
const getImgEle = (target, loaded = false) => {
	const url = typeof target === "number" ? store.imgList[target] : target;
	for (const element of refs.imgEleMap[url] ?? []) if (!loaded || element.complete) return element;
};
/** 触发 onOptionChange */
const triggerOnOptionChange = helper.throttle(() => store.prop.onOptionChange?.(helper.difference(store.option, store.defaultOption)), 1e3);
/** 在 option 后手动触发 onOptionChange */
const setOption = (...args) => {
	if (args.length === 1 && typeof args[0] === "function") setState((state) => args[0](state.option, state));
	else setState("option", ...args);
	triggerOnOptionChange();
};
/** 创建用于将 ref 绑定到对应 state 上的工具函数 */
const bindRef = (name) => (e) => Reflect.set(refs, name, e);
const watchDomSize = (name, e) => {
	const resizeObserver = new ResizeObserver(([{ contentRect }]) => {
		if (!contentRect.width || !contentRect.height) return;
		setState((state) => {
			state[name] = {
				width: contentRect.width,
				height: contentRect.height
			};
		});
	});
	resizeObserver.disconnect();
	resizeObserver.observe(e);
	solid_js.onCleanup(() => resizeObserver.disconnect());
};
/** 将界面恢复到正常状态 */
const resetUI = (state) => {
	state.show.toolbar = false;
	state.show.scrollbar = false;
	state.show.touchArea = false;
	state.show.pageTip = false;
};
const focus = () => requestAnimationFrame(() => {
	if (!store.autoScroll.play) refs.mangaBox?.click();
	refs.mangaBox?.focus();
});
/** 将函数的 state 参数变为可选 */
const withOptionalState = (fn) => (...args) => {
	if (args.length < fn.length) {
		let result;
		setState((state) => {
			result = fn(...[...args, state]);
		});
		return result;
	}
	return fn(...args);
};
const closeScrollLock = helper.debounce(() => setState("scrollLock", false), 100);
/** 打开滚动锁，并在之后自动关闭 */
const openScrollLock = withOptionalState((state) => {
	state.scrollLock = true;
	closeScrollLock();
});
const bindOption = (...path) => ({
	value: helper.byPath(store.option, path),
	onChange: (val) => setOption(...path, val)
});
//#endregion
//#region src/components/Manga/actions/memo/options.ts
/** 当前是否为并排卷轴模式 */
const isAbreastMode = helper.createRootMemo(() => store.option.scrollMode.enabled && store.option.scrollMode.abreastMode);
/** 当前是否为双页卷轴模式 */
const isDoubleMode = helper.createRootMemo(() => store.option.scrollMode.enabled && store.option.scrollMode.doubleMode && !store.option.scrollMode.abreastMode);
/** 当前是否为单页卷轴模式 */
const isSingleMode = helper.createRootMemo(() => store.option.scrollMode.enabled && !store.option.scrollMode.doubleMode && !store.option.scrollMode.abreastMode);
/** 当前是否为普通卷轴模式（包含了双页卷轴模式） */
const isScrollMode = helper.createRootMemo(() => store.option.scrollMode.enabled && !store.option.scrollMode.abreastMode);
/** 当前是否正在卷轴模式下使用自动缩放值 */
const isUseAutoScale = helper.createRootMemo(() => isScrollMode() && typeof store.option.scrollMode.adjustToWidth === "number");
/** 当前是否开启了识别背景色 */
const isEnableBg = helper.createRootMemo(() => store.option.imgRecognition.enabled && store.option.imgRecognition.background);
/** 当前是否开启了图像放大 */
const isUpscale = helper.createRootMemo(() => !store.isMobile && store.option.imgRecognition.enabled && store.option.imgRecognition.upscale);
/** 根据视区宽高判断单双页模式 */
const autoPageNum = helper.createThrottleMemo(() => store.rootSize.width >= store.rootSize.height ? 2 : 1);
/** 当前使用的单双页模式 */
const pageNum = helper.createRootMemo(() => store.option.pageNum || autoPageNum());
/** 是否为单页模式 */
const isOnePageMode = helper.createRootMemo(() => {
	if (store.isMobile || store.imgList.length <= 1) return true;
	if (store.option.scrollMode.enabled) {
		if (store.option.scrollMode.abreastMode) return true;
		return !store.option.scrollMode.doubleMode;
	}
	return pageNum() === 1;
});
//#endregion
//#region src/components/Manga/actions/memo/abreastScroll.ts
/** 并排卷轴模式下的全局滚动填充 */
const [abreastScrollFill, _setAbreastScrollFill] = solid_js.createSignal(0);
/** 并排卷轴模式下的每列布局 */
const abreastArea = helper.createRootMemo((prev) => {
	if (!isAbreastMode()) return prev;
	const columns = [[]];
	const position = {};
	let length = 0;
	const rootHeight = store.rootSize.height;
	if (!rootHeight || store.imgList.length === 0) return {
		columns,
		position,
		length
	};
	const repeatHeight = rootHeight * store.option.scrollMode.abreastDuplicate;
	/** 当前图片在当前列的所在高度 */
	let top = abreastScrollFill();
	while (top > rootHeight) {
		top -= rootHeight - repeatHeight;
		columns.push([]);
	}
	for (let i = 0; i < store.imgList.length; i++) {
		const img = getImg(i);
		const imgPosition = [];
		const imgHeight = img.size.height;
		length += imgHeight;
		let height = imgHeight;
		while (height > 0) {
			columns.at(-1).push(i);
			imgPosition.push({
				column: columns.length - 1,
				top
			});
			if (top < 0 && imgPosition.length > 1) top = 0;
			const availableHeight = rootHeight - top;
			top += height;
			height -= availableHeight;
			if (top < rootHeight) continue;
			columns.push([]);
			top = height - imgHeight;
			if (!repeatHeight || columns.length === 1) continue;
			top += repeatHeight;
			height = Math.min(imgHeight, height + repeatHeight);
			/** 为了复现而出现的空白部分高度 */
			let emptyTop = top;
			let prevImgIndex = i;
			while (prevImgIndex >= 1 && emptyTop > 0) {
				prevImgIndex -= 1;
				columns.at(-1).push(prevImgIndex);
				const prevImgHeight = getImg(prevImgIndex).size.height;
				emptyTop -= prevImgHeight;
				position[prevImgIndex].push({
					column: columns.length - 1,
					top: emptyTop
				});
			}
		}
		position[i] = imgPosition;
	}
	return {
		columns,
		position,
		length
	};
}, {
	columns: [],
	position: {},
	length: 0
});
/** 头尾滚动的限制值 */
const scrollFillLimit = helper.createRootMemo(() => abreastArea().length - store.rootSize.height);
const setAbreastScrollFill = (val) => _setAbreastScrollFill(helper.clamp(-scrollFillLimit(), val, scrollFillLimit()));
/** 并排卷轴模式下的列宽度 */
const abreastColumnWidth = helper.createRootMemo(() => isAbreastMode() ? placeholderSize().width * store.option.scrollMode.imgScale : 0);
/** 并排卷轴模式下当前要显示的列 */
const abreastShowColumn = helper.createThrottleMemo(() => {
	if (!isAbreastMode() || abreastArea().columns.length === 0) return {
		start: 0,
		end: 0
	};
	const columnWidth = abreastColumnWidth() + store.option.scrollMode.spacing * 7;
	return {
		start: helper.clamp(0, Math.floor(store.page.offset.x.px / columnWidth), abreastArea().columns.length - 1),
		end: helper.clamp(0, Math.floor((store.page.offset.x.px + store.rootSize.width) / columnWidth), abreastArea().columns.length - 1)
	};
});
/** 并排卷轴模式下的漫画流宽度 */
const abreastContentWidth = helper.createRootMemo(() => abreastArea().columns.length * abreastColumnWidth() + (abreastArea().columns.length - 1) * store.option.scrollMode.spacing * 7);
/** 并排卷轴模式下的最大滚动距离 */
const abreastScrollWidth = helper.createRootMemo(() => abreastContentWidth() - store.rootSize.width);
//#endregion
//#region src/components/Manga/actions/pageData.ts
/** 重新计算图片排列 */
const updatePageData = (state) => {
	const lastActiveImgIndex = activeImgIndex();
	let newPageList = [];
	newPageList = isOnePageMode() ? state.imgList.map((_, i) => [i]) : handleComicData(state.imgList.map((url) => state.imgMap[url]), state.fillEffect, state.option.imgRecognition.pageFill);
	if (helper.isEqual(state.pageList, newPageList)) return;
	state.pageList = newPageList;
	if (lastActiveImgIndex !== activeImgIndex()) {
		const newActivePageIndex = state.pageList.findIndex((page) => page.includes(lastActiveImgIndex));
		if (newActivePageIndex !== -1) state.activePageIndex = newActivePageIndex;
	}
};
updatePageData.throttle = helper.throttle(() => setState(updatePageData), 100);
/**
* 将处理图片的相关变量恢复到初始状态
*
* 必须按照以下顺序调用
* 1. 修改 imgList
* 2. resetImgState
* 3. updatePageData
*/
const resetImgState = (state) => {
	if (state.imgList.length === 0) {
		state.fillEffect = { "-1": true };
		return;
	}
	if (typeof state.fillEffect["-1"] === "boolean") state.fillEffect["-1"] = state.option.firstPageFill && state.imgList.length > 3;
};
helper.createEffectOn([pageNum, isOnePageMode], () => setState(updatePageData));
//#endregion
//#region src/components/Manga/actions/memo/observer.ts
/** 记录每张图片所在的页面 */
const imgPageMap = helper.createRootMemo(() => {
	const map = {};
	for (let i = 0; i < store.pageList.length; i++) for (const imgIndex of store.pageList[i]) if (imgIndex !== -1) map[imgIndex] = i;
	return map;
});
/** 滚动距离 */
const scrollTop = helper.createRootMemo(() => isAbreastMode() ? store.page.offset.x.px : store.scrollTop);
const bindScrollTop = (dom) => {
	dom.addEventListener("scroll", () => {
		if (helper.approx(dom.scrollTop, store.scrollTop)) return;
		setState("scrollTop", dom.scrollTop);
	}, { passive: true });
};
helper.createEffectOn(() => store.rootSize.width, (width) => {
	const isMobile = helper.inRange(1, width, 800);
	if (isMobile === store.isMobile) return;
	setState((state) => {
		state.isMobile = isMobile;
		resetImgState(state);
		updatePageData(state);
	});
});
//#endregion
//#region src/components/Manga/actions/memo/scrollMode.ts
/** 双页卷轴模式下的页面列表（按行分组） */
const scrollPageList = helper.createRootMemo(() => {
	if (!isDoubleMode()) return store.pageList.map((page) => [page]);
	const { pageColumns } = store.option.scrollMode;
	if (pageColumns <= 1) return store.pageList.map((page) => [page]);
	const rows = [];
	for (let i = 0; i < store.pageList.length; i += pageColumns) rows.push(store.pageList.slice(i, i + pageColumns));
	return rows;
});
/** 卷轴模式下每行高度 */
const pageHeightList = helper.createThrottleMemo(() => {
	if (!isScrollMode()) return [];
	if (!isDoubleMode()) return imgList().map((img) => img.size.height ?? 0);
	const { pageColumns } = store.option.scrollMode;
	const doubleWidth = store.rootSize.width / pageColumns / 2;
	const imgDisplayHeight = ({ width, height }) => width < doubleWidth && store.option.scrollMode.adjustToWidth === "disable" ? height : height * (doubleWidth / width);
	return scrollPageList().map((row) => Math.max(...row.flatMap((indexs) => indexs.filter((i) => i !== -1).map((i) => imgDisplayHeight(getImg(i).size)))));
}, 100);
/** 卷轴模式下每页位置 */
const pageTopList = helper.createRootMemo(() => {
	if (!isScrollMode()) return [];
	const list = Array.from({ length: store.pageList.length });
	const rows = scrollPageList();
	for (let top = 0, i = 0, rowIdx = 0; rowIdx < rows.length; rowIdx++) {
		const row = rows[rowIdx];
		for (let col = 0; col < row.length; col++) list[i + col] = top;
		i += row.length;
		top += pageHeightList()[rowIdx] + store.option.scrollMode.spacing * 7;
	}
	return list;
});
/** 卷轴模式下漫画流的总高度 */
const contentHeight = helper.createRootMemo(() => {
	if (!isScrollMode()) return 0;
	return (pageTopList().at(-1) ?? 0) + (pageHeightList().at(-1) ?? 0);
});
/** 获取卷轴模式下指定页的位置 */
const getPageTop = (index) => {
	if (Reflect.has(pageTopList(), index)) return pageTopList()[index];
	if (index < 0) return 0;
	return contentHeight();
};
/** 找到卷轴模式下指定高度上显示的页面 */
const findTopPage = (top, initIndex = 0) => {
	if (top > contentHeight()) return pageTopList().length - 1;
	for (let i = initIndex; i < pageTopList().length; i++) if (pageTopList()[i] > top) return i === 0 ? 0 : i - 1;
	return pageTopList().length - 1;
};
//#endregion
//#region src/components/Manga/actions/memo/scroll.ts
/** 滚动内容的滚动进度 */
const scrollProgress = helper.createRootMemo(() => {
	if (store.option.scrollMode.enabled) return scrollTop();
	return store.activePageIndex;
});
/** 滚动内容的总长度 */
const scrollLength = helper.createRootMemo(() => {
	if (store.option.scrollMode.enabled) {
		if (store.option.scrollMode.abreastMode) return abreastContentWidth();
		return contentHeight();
	}
	return store.pageList.length;
});
/** 滚动内容的滚动进度百分比 */
const scrollPercentage = helper.createRootMemo(() => scrollProgress() / scrollLength());
/** 当前是否已经滚动到顶部 */
const isTop = helper.createRootMemo(() => scrollPercentage() === 0);
/** 滚动条元素的长度 */
const scrollDomLength = helper.createRootMemo(() => Math.max(store.scrollbarSize.width, store.scrollbarSize.height));
/** 滚动条滑块长度 */
const sliderHeight = helper.createRootMemo(() => {
	let itemLength = 1;
	if (isScrollMode()) itemLength = store.rootSize.height;
	if (isAbreastMode()) itemLength = store.rootSize.width;
	return itemLength / scrollLength();
});
/** 当前是否已经滚动到底部 */
const isBottom = helper.createRootMemo(() => scrollPercentage() + sliderHeight() >= .9999);
/** 滚动条滑块的中心点高度 */
const sliderMidpoint = helper.createRootMemo(() => scrollDomLength() * (scrollPercentage() + sliderHeight() / 2));
/** 滚动条滑块的位置 */
const sliderTop = helper.createRootMemo(() => `${scrollPercentage() * scrollDomLength()}px`);
/** 滚动条位置 */
const scrollPosition = helper.createRootMemo(() => {
	if (store.option.scrollbar.position === "auto") {
		if (store.isMobile) return "top";
		if (isAbreastMode()) return "bottom";
		return store.defaultImgType === "long" ? "bottom" : "right";
	}
	return store.option.scrollbar.position;
});
//#endregion
//#region src/components/Manga/actions/endPage.ts
/** 处理尽头翻页。返回当前是否已抵达尽头 */
const handleEndTurnPage = withOptionalState((dir, state) => {
	if (dir === "prev") switch (state.show.endPage) {
		case "start":
			if (state.scrollLock || store.option.scroolEnd !== "auto") return true;
			state.prop.onPrev?.();
			return true;
		case "end":
			state.show.endPage = void 0;
			return true;
		default: if (isTop()) {
			if (state.scrollLock) return true;
			if (!state.prop.onExit || !state.prop.onPrev || store.option.scroolEnd !== "auto") return true;
			state.show.endPage = "start";
			return true;
		}
	}
	else switch (state.show.endPage) {
		case "end":
			if (state.scrollLock || store.option.scroolEnd === "none") return true;
			if (store.option.scroolEnd === "auto" && state.prop.onNext) state.prop.onNext();
			else state.prop.onExit?.(true);
			return true;
		case "start":
			state.show.endPage = void 0;
			return true;
		default: if (isBottom()) {
			if (state.scrollLock) return true;
			if (!state.prop.onExit) return true;
			state.show.endPage = "end";
			return true;
		}
	}
	return false;
});
//#endregion
//#region src/components/Manga/actions/imageLoad/state.ts
/** 图片加载管理器的持久状态 */
const loadState = {
	/** 图片上次加载出错的时间，用于退避重试 */
	imgErrorMap: /* @__PURE__ */ new Map(),
	/** 尚未加载完成（包含出错）且有 src 的图片 url 集合 */
	unloadedUrlSet: /* @__PURE__ */ new Set(),
	/** 当前没有 src 的图片数量 */
	waitUrlImgNum: 0,
	/** 当前 loadType === 'loading' 的图片 url 集合 */
	loadingUrlSet: new helper.ReactiveSet(),
	/** 存放正在使用「图像识别」功能特殊下载的图片 url 所对应的 AbortController */
	abortMap: /* @__PURE__ */ new Map()
};
const setLoadingUrlSet = (urls) => {
	solid_js.batch(() => {
		loadState.loadingUrlSet.clear();
		for (const url of urls) loadState.loadingUrlSet.add(url);
	});
};
/** 在 `store.imgList` 或 `store.imgMap` 被修改后，进行完整的状态更新 */
const syncImgLoadState = (state) => {
	loadState.unloadedUrlSet.clear();
	let waitNum = 0;
	const nextLoading = /* @__PURE__ */ new Set();
	for (const url of state.imgList) {
		const img = state.imgMap[url];
		if (!img) continue;
		if (img.src) {
			if (img.loadType !== "loaded") loadState.unloadedUrlSet.add(url);
		} else waitNum += 1;
		if (img.loadType === "loading") nextLoading.add(url);
	}
	loadState.waitUrlImgNum = waitNum;
	setLoadingUrlSet(nextLoading);
};
//#endregion
//#region src/components/Manga/actions/imageType.ts
const isWideType = (type) => type === "wide" || type === "long";
const 单页比例 = 960 / 1080;
const 横幅比例 = 1920 / 1080;
const 条漫比例 = 960 / 1080 / 2;
/** 根据比例判断图片类型 */
const getImgType = (img) => {
	const imgRatio = img.width / img.height;
	if (imgRatio <= 单页比例) return imgRatio < 条漫比例 ? "vertical" : "";
	return imgRatio > 横幅比例 ? "long" : "wide";
};
/** 更新图片类型。返回是否修改了图片类型 */
const updateImgType = (state, draftImg) => {
	const { type } = draftImg;
	if (!draftImg.width || !draftImg.height) return false;
	draftImg.type = getImgType(draftImg);
	if (isWideType(type) !== isWideType(draftImg.type)) updatePageData.throttle();
	return (type ?? state.defaultImgType) !== draftImg.type;
};
/** 是否自动开启过卷轴模式 */
let autoScrollMode = false;
helper.createRootEffect((prevIsWide) => {
	if (store.rootSize.width === 0 || store.rootSize.height === 0) return;
	const defaultImgType = getImgType(placeholderSize());
	if (defaultImgType === store.defaultImgType) return prevIsWide;
	const isWide = isWideType(defaultImgType);
	setState((state) => {
		state.defaultImgType = defaultImgType;
		if (defaultImgType === "vertical" && !autoScrollMode && !state.option.scrollMode.enabled) {
			state.option.scrollMode.enabled = true;
			autoScrollMode = true;
			return;
		}
		if (isWide !== prevIsWide) updatePageData(state);
	});
	return isWide;
}, false);
//#endregion
//#region src/components/Manga/actions/imageSize.ts
/** 计算裁切后的四边比例，没有裁切时返回 null */
const getCropMargin = ({ blankMargin: margin, width, height }, state = store) => {
	const { crop, keepMargin } = state.option.imgRecognition;
	if (!crop || !margin || !width || !height) return null;
	const left = Math.max(0, margin.left - keepMargin / width);
	const right = Math.max(0, margin.right - keepMargin / width);
	const top = Math.max(0, margin.top - keepMargin / height);
	const bottom = Math.max(0, margin.bottom - keepMargin / height);
	if (left + right + top + bottom === 0) return null;
	return {
		left,
		right,
		top,
		bottom
	};
};
/** 获取指定图片的显示尺寸（会将边缘裁切计算在内） */
const getImgDisplaySize = (state, img) => {
	let height = img.height ?? placeholderSize().height;
	let width = img.width ?? placeholderSize().width;
	if (state.option.imgRecognition.crop && img.width && img.height) {
		const crop = getCropMargin(img, state);
		if (crop) {
			width = img.width * (1 - crop.left - crop.right);
			height = img.height * (1 - crop.top - crop.bottom);
		}
	}
	if (!state.option.scrollMode.enabled) return {
		height,
		width
	};
	const setWidth = (w) => {
		height *= w / width;
		width = w;
		return {
			height,
			width
		};
	};
	if (isAbreastMode()) return setWidth(abreastColumnWidth());
	if (state.option.scrollMode.adjustToWidth === "full") return setWidth(state.rootSize.width);
	if (typeof state.option.scrollMode.adjustToWidth === "number") {
		const target = state.option.scrollMode.adjustToWidth;
		const type = img.type ?? state.defaultImgType;
		if (isWideType(type)) {
			const ratio = height / width;
			width = helper.clamp(Math.min(target, state.rootSize.width), width, state.rootSize.width);
			height = width * ratio;
			return {
				height,
				width
			};
		}
		return setWidth(Math.min(target, state.rootSize.width));
	}
	if (state.option.scrollMode.imgScale !== 1) {
		height *= state.option.scrollMode.imgScale;
		width *= state.option.scrollMode.imgScale;
	}
	if (width > state.rootSize.width) return setWidth(state.rootSize.width);
	return {
		height,
		width
	};
};
/** 更新图片尺寸 */
const updateImgSize = withOptionalState((url, width, height, state) => {
	const img = state.imgMap[url];
	if (img.width !== width || img.height !== height) {
		img.width = width;
		img.height = height;
		updateImgType(state, img);
	}
	const size = getImgDisplaySize(state, img);
	if (img.size.width !== size.width || img.size.height !== size.height) Object.assign(img.size, size);
});
helper.createEffectOn([
	() => store.rootSize,
	() => store.option.scrollMode.enabled,
	() => store.option.scrollMode.imgScale,
	() => store.option.scrollMode.abreastMode,
	() => store.option.scrollMode.adjustToWidth,
	() => store.option.imgRecognition.crop,
	() => store.option.imgRecognition.keepMargin
], () => {
	setState((state) => {
		for (const url of state.imgList) {
			const img = state.imgMap[url];
			Object.assign(img.size, getImgDisplaySize(state, img));
		}
	});
});
helper.createEffectOn(placeholderSize, () => {
	setState((state) => {
		const skipLoaded = !isAbreastMode();
		for (const url of state.imgList) {
			const img = state.imgMap[url];
			if (skipLoaded && img.width !== void 0) continue;
			Object.assign(img.size, getImgDisplaySize(state, img));
		}
	});
});
//#endregion
//#region src/components/Manga/actions/renderPage.ts
/** 获取并排卷轴模式下指定列的指定图片 */
const getAbreastColumnImg = (column, img) => {
	const { columns } = abreastArea();
	return columns[helper.clamp(0, column, columns.length - 1)]?.at(img) ?? 0;
};
/** 计算显示页面 */
const updateShowRange = (state) => {
	if (scrollLength() === 0) {
		state.showRange = [0, 0];
		state.renderRange = state.showRange;
	} else if (!state.option.scrollMode.enabled) {
		state.showRange = [state.activePageIndex, state.activePageIndex];
		state.renderRange = [helper.clamp(0, state.activePageIndex - 1, state.pageList.length - 1), helper.clamp(0, state.activePageIndex + 1, state.pageList.length - 1)];
	} else if (state.option.scrollMode.abreastMode) {
		const { start, end } = abreastShowColumn();
		state.showRange = [getAbreastColumnImg(start, 0), getAbreastColumnImg(end, -1)];
		state.renderRange = [getAbreastColumnImg(start - 2, 0), getAbreastColumnImg(end + 2, -1)];
	} else {
		const top = scrollTop();
		const bottom = scrollTop() + state.rootSize.height;
		const renderTop = top - state.rootSize.height;
		const rednerBottom = bottom + state.rootSize.height;
		const renderTopImg = findTopPage(renderTop);
		const topImg = findTopPage(top, renderTopImg);
		const bottomImg = findTopPage(bottom, topImg);
		const renderBottomImg = findTopPage(rednerBottom, bottomImg);
		state.showRange = [topImg, bottomImg];
		state.renderRange = [renderTopImg, renderBottomImg];
	}
};
helper.createEffectOn([
	scrollLength,
	() => store.option.scrollMode.enabled,
	() => store.activePageIndex,
	() => store.option.scrollMode.abreastMode,
	() => store.rootSize,
	abreastShowColumn,
	scrollTop
], helper.throttle(() => setState(updateShowRange)));
/** 获取指定范围内页面所包含的图片 */
const getRangeImgList = (range) => {
	let list;
	if (range[0] === range[1]) list = new Set(store.pageList[range[0]]);
	else {
		list = /* @__PURE__ */ new Set();
		for (const [a, b] of store.pageList.slice(range[0], range[1] + 1)) {
			list.add(a);
			if (b !== void 0) list.add(b);
		}
	}
	list.delete(-1);
	return list;
};
const renderImgList = helper.createRootMemo(() => getRangeImgList(store.renderRange));
const showImgList = helper.createRootMemo(() => getRangeImgList(store.showRange));
/** 更新每张图片在 store 中的显示状态 */
helper.createEffectOn(() => store.renderRange, () => {
	const newState = {};
	for (let [i] = store.renderRange; i <= store.renderRange[1]; i++) {
		const page = store.pageList[i];
		if (!page) continue;
		const [a, b] = page;
		if (b === void 0) newState[a] = "";
		else {
			newState[a] = 0;
			newState[b] = 1;
		}
	}
	setState("imgShowState", solid_js_store.reconcile(newState));
});
helper.createEffectOn([() => store.showRange, () => store.option.scrollMode.enabled], ([[firstPage], isScrollMode]) => isScrollMode && setState("activePageIndex", firstPage ?? 0));
helper.createEffectOn(showImgList, (showImgs) => {
	if (showImgs.size === 0) return;
	store.prop.onShowImgsChange?.({
		showImgs,
		imgList: imgList(),
		showRange: [...store.showRange],
		pageList: store.pageList,
		activeImgIndex: activeImgIndex(),
		fillEffect: solid_js_store.unwrap(store.fillEffect)
	});
}, { defer: true });
/** 将页面移回原位 */
const resetPage = (state, animation = false) => {
	updateShowRange(state);
	state.page.offset.x.pct = 0;
	state.page.offset.y.pct = 0;
	if (state.option.scrollMode.enabled) {
		state.page.anima = "";
		return;
	}
	let i = -1;
	if (helper.inRange(state.renderRange[0], state.activePageIndex, state.renderRange[1])) i = state.activePageIndex - state.renderRange[0];
	if (store.page.vertical) state.page.offset.y.pct = i === -1 ? 0 : -i;
	else state.page.offset.x.pct = i === -1 ? 0 : i;
	state.page.anima = animation ? "page" : "";
};
//#endregion
//#region src/components/Manga/actions/imageLoad/scheduler.ts
/** 获取指定页数下的头/尾图片 */
const getPageImg = (pageNum, imgType) => {
	const page = store.pageList[pageNum].filter((i) => i !== -1);
	if (page.length === 1) return page[0];
	return imgType === "start" ? Math.min(...page) : Math.max(...page);
};
/** 规划当前要加载的图片 */
const planLoadBatch = () => {
	/** 当前批次中需要改成 loading 的图片 */
	const loadImgList = /* @__PURE__ */ new Set();
	/** 当前加载范围内还没有 src 的图片索引 */
	const waitUrlImgs = /* @__PURE__ */ new Set();
	/** 加载指定图片。返回是否已加载完成 */
	const loadImg = (index) => {
		const img = getImg(index);
		if (!img.src) {
			waitUrlImgs.add(index);
			return true;
		}
		if (img.loadType === "loaded" || img.loadType === "error") return true;
		loadImgList.add(img.src);
		return false;
	};
	/**
	* 以当前显示页为基准，预加载附近指定页数的图片，并取消其他预加载的图片
	* @param target 加载目标页
	* @param loadNum 加载图片数量
	* @returns 返回指定范围内是否还有未加载的图片
	*/
	const loadRangeImg = (target = 0, loadNum = 2) => {
		let start = getPageImg(store.showRange[0], "start");
		let end = getPageImg(store.showRange[1], "end");
		if (target !== 0) {
			if (target < 0) {
				end = start + target;
				start -= 1;
			} else {
				start = end + 1;
				end += target;
			}
			start = helper.clamp(0, start, store.imgList.length - 1);
			end = helper.clamp(0, end, store.imgList.length - 1);
		}
		/** 是否还有未加载的图片 */
		let hasUnloadedImg = false;
		let index = start;
		const condition = start <= end ? () => index <= end : () => index >= end;
		const step = start <= end ? 1 : -1;
		while (condition()) {
			if (!loadImg(index)) hasUnloadedImg = true;
			if (loadImgList.size >= loadNum) return index !== end || hasUnloadedImg;
			index += step;
		}
		return hasUnloadedImg;
	};
	if (store.imgList.length > 0) loadRangeImg() || loadRangeImg(preloadNum().back) || loadRangeImg(-preloadNum().front) || !store.option.alwaysLoadAllImg || loadRangeImg(Infinity, 5) || loadRangeImg(Number.NEGATIVE_INFINITY, 5);
	return {
		loadImgList,
		waitUrlImgs
	};
};
/** 根据当前显示范围重新计算并修改图片加载状态 */
const updateImgLoadType = helper.singleThreaded(() => {
	if (store.showRange[0] < 0 || loadState.unloadedUrlSet.size === 0 && loadState.waitUrlImgNum === 0) return;
	const { loadImgList, waitUrlImgs } = planLoadBatch();
	store.prop.onWaitUrlImgs?.(waitUrlImgs, imgList());
	setState((state) => {
		for (const url of /* @__PURE__ */ new Set([...loadState.loadingUrlSet, ...loadImgList])) {
			const img = state.imgMap[url];
			if (!img) continue;
			if (loadImgList.has(url)) {
				if (img.loadType !== "loading") {
					img.loadType = "loading";
					if (!store.option.imgRecognition.enabled && img.width === void 0) setTimeout(checkImgSize, 0, img.src);
				}
			} else if (img.loadType === "loading") img.loadType = "wait";
		}
	});
	setLoadingUrlSet(loadImgList);
});
helper.createEffectOn([
	preloadNum,
	renderImgList,
	() => store.imgMap,
	() => store.option.alwaysLoadAllImg
], updateImgLoadType);
/** 加载期间尽快获取图片尺寸 */
const checkImgSize = (url) => {
	const imgDom = getImgEle(url);
	if (!imgDom) return;
	const timeoutId = setInterval(() => {
		if (!imgDom?.isConnected || store.option.imgRecognition.enabled) return clearInterval(timeoutId);
		const img = store.imgMap[url];
		if (!img || img.loadType !== "loading") return clearInterval(timeoutId);
		if (imgDom.naturalWidth && imgDom.naturalHeight) {
			updateImgSize(url, imgDom.naturalWidth, imgDom.naturalHeight);
			return clearInterval(timeoutId);
		}
	}, 200);
};
//#endregion
//#region src/components/Manga/actions/imageRecognition.ts
/**
* 在「图像识别」相关功能的配置变更后变更
* 用于在 worker 执行结束后判断数据是否过期
*/
let recognitionVersion = 0;
/** 使所有正在进行的图像识别结果失效 */
const invalidateRecognition = () => {
	recognitionVersion += 1;
	setState((state) => {
		for (const img of Object.values(state.imgMap)) img.recognitionVersion = void 0;
	});
};
/** 判断图片是否处于当前渲染范围内 */
const isInRenderRange = (url) => {
	const renderList = renderImgList();
	return getImgIndexs(url).some((index) => renderList.has(index));
};
const handleImgRecognition = async (url, imgEle) => {
	const img = store.imgMap[url];
	if (!img || img.recognitionVersion !== void 0) return;
	if (!(store.option.imgRecognition.background && img.background === void 0 || store.option.imgRecognition.pageFill && img.blankMargin === void 0 || store.option.imgRecognition.crop && img.blankMargin === void 0)) return;
	if (!isInRenderRange(url)) return;
	imgEle ??= await helper.wait(() => getImgEle(url, true), 1e3);
	if (!imgEle) return helper.log.warn("获取图片元素失败");
	setState("imgMap", url, "recognitionVersion", recognitionVersion);
	const { data, width, height } = helper.getImageData(imgEle, 200);
	initWorker$1();
	await worker_ImageRecognition.default.recognitionImg(comlink.default.transfer(data, [data.buffer]), {
		width,
		height,
		url,
		index: Number(imgEle.alt),
		option: solid_js_store.unwrap(store.option.imgRecognition),
		version: recognitionVersion
	});
};
const initWorker$1 = helper.once(() => {
	const mainFn = {
		log: helper.log,
		updatePageData: helper.throttle(() => setState(updatePageData), 1e3),
		setImg: ({ url, key, val, version }) => {
			if (!Reflect.has(store.imgMap, url)) return;
			if (version !== recognitionVersion) return;
			setState("imgMap", url, key, val);
			if (key === "blankMargin" && store.option.imgRecognition.crop) {
				const { width, height } = store.imgMap[url];
				if (width && height) updateImgSize(url, width, height);
			}
		}
	};
	worker_ImageRecognition.default.setMainFn(comlink.default.proxy(mainFn), Object.keys(mainFn));
});
helper.createEffectOn([
	renderImgList,
	() => store.option.imgRecognition.enabled,
	() => store.option.imgRecognition.background,
	() => store.option.imgRecognition.pageFill,
	() => store.option.imgRecognition.crop
], ([imgList, enabled]) => {
	if (!enabled) return;
	for (const index of imgList) {
		const img = getImg(index);
		if (img.loadType === "loaded") handleImgRecognition(img.src);
	}
});
//#endregion
//#region src/components/Manga/helper.ts
/** 阻止事件冒泡 */
const stopPropagation = (e) => e.stopPropagation();
/** 从头开始播放元素的动画 */
const playAnimation = (e) => {
	if (!e) return;
	for (const animation of e.getAnimations()) {
		animation.cancel();
		animation.play();
	}
};
const downloadImg = async (imgUrl, details, retryNum = 0) => {
	const url = store.imgMap[imgUrl]?.blobUrl ?? imgUrl;
	if (url.startsWith("blob:")) return (await fetch(url)).blob();
	const res = await request.downloadImg(url, details, retryNum);
	if (Reflect.has(store.imgMap, imgUrl)) setState("imgMap", imgUrl, "blobUrl", URL.createObjectURL(res));
	return res;
};
//#endregion
//#region src/components/Manga/actions/translation/TranslationTask.ts
/**
* 翻译任务基类
*
* 每个翻译任务都是独立的实例，负责单张图片的完整翻译流程。
* 子类需要实现 {@link work} 方法来定义具体的翻译逻辑。
*/
var TranslationTask = class {
	url;
	constructor(url) {
		this.url = url;
	}
	/** 更新当前图片的翻译状态消息 */
	setMessage(message) {
		setState("imgMap", this.url, "translationMessage", message);
	}
	/** 下载图片 */
	async download(url = this.url, details) {
		try {
			return await downloadImg(url, details);
		} catch (error) {
			helper.log.error(error);
			store.prop.onImgError?.(url);
			throw new Error(helper.t("translation.tip.download_img_failed"), { cause: error });
		}
	}
	/** 缩小过大的图片（超过 4096px） */
	async resize(blob) {
		const img = store.imgMap[this.url];
		const w = img.width;
		const h = img.height;
		if (w <= 4096 && h <= 4096) return blob;
		try {
			const scale = Math.min(4096 / w, 4096 / h);
			const width = Math.floor(w * scale);
			const height = Math.floor(h * scale);
			const imgDom = await helper.waitImgLoad(URL.createObjectURL(blob));
			const canvas = new OffscreenCanvas(width, height);
			const ctx = canvas.getContext("2d");
			ctx.imageSmoothingQuality = "high";
			ctx.drawImage(imgDom, 0, 0, width, height);
			URL.revokeObjectURL(imgDom.src);
			return await helper.canvasToBlob(canvas);
		} catch (error) {
			helper.log.error("缩小图片尺寸时出错", error);
			return blob;
		}
	}
	/**
	* 执行翻译任务
	* @returns 翻译后的图片 URL
	*/
	async run() {
		try {
			await this.init();
			this.setMessage(helper.t("translation.tip.img_downloading"));
			let blob = await this.download();
			blob = await this.resize(blob);
			return await this.work(blob);
		} catch (error) {
			this.setMessage(error.message);
			helper.log.error("翻译出错", error);
			components_Toast.toast.error(error.message);
			throw error;
		}
	}
	/** 初始化任务，子类可重写 */
	async init() {}
};
//#endregion
//#region src/components/Manga/actions/translation/translator/Cotrans/index.ts
/**
* Cotrans 翻译任务实现
*
* 使用 cotrans.touhou.ai 公共服务进行图片翻译。
* 通过 WebSocket 或轮询获取翻译状态，最终合并原图和翻译蒙版。
*/
/**
* Cotrans 翻译任务
*
* 使用 cotrans.touhou.ai 公共翻译服务。
* 返回的是翻译蒙版，需要与原图合并。
*/
var Cotrans = class Cotrans extends TranslationTask {
	/** 创建上传表单数据 */
	static createFormData(blob) {
		const formData = new FormData();
		const fileName = `image.${blob.type.split("/").at(-1)}`;
		const file = new File([blob], fileName, { type: blob.type });
		const options = store.option.translation.cotrans;
		formData.append("file", file);
		formData.append("mime", file.type);
		formData.append("size", sizeDict[options.detector.detection_size]);
		formData.append("detector", options.detector.detector);
		formData.append("direction", options.render.direction);
		formData.append("translator", options.translator.translator);
		formData.append("target_language", options.translator.target_lang);
		formData.append("retry", `${store.option.translation.forceRetry}`);
		return formData;
	}
	/** 上传图片到 Cotrans 服务器 */
	async upload(blob) {
		try {
			return await request.request("https://api.cotrans.touhou.ai/task/upload/v1", {
				method: "POST",
				data: Cotrans.createFormData(blob)
			});
		} catch (error) {
			helper.log.error(error);
			throw new Error(helper.t("translation.tip.upload_error"), { cause: error });
		}
	}
	/** 解析上传响应 */
	parse(json) {
		let data;
		try {
			data = JSON.parse(json);
		} catch (error) {
			throw new Error(`${helper.t("translation.tip.upload_return_error")}：${json}`, { cause: error });
		}
		if ("error_id" in data) throw new Error(`${helper.t("translation.tip.upload_return_error")}：${data.error_id}`);
		if (!data.id) throw new Error(helper.t("translation.tip.id_not_returned"));
		return data;
	}
	/** 处理 WebSocket 或轮询返回的消息 */
	handleMessage(msg) {
		switch (msg.type) {
			case "result": return msg.result.translation_mask;
			case "pending":
				this.setMessage(helper.t("translation.tip.pending", { pos: msg.pos }));
				break;
			case "status":
				this.setMessage(helper.t(`translation.status.${msg.status}`) || msg.status);
				break;
			case "error": throw new Error(`${helper.t("translation.status.error")}：id ${msg.error_id}`);
			case "not_found": throw new Error(`${helper.t("translation.status.error")}：Not Found`);
		}
	}
	/** 通过轮询等待翻译完成 */
	async waitByPolling(id) {
		let result;
		while (result === void 0) {
			const res = await request.request(`https://api.cotrans.touhou.ai/task/${id}/status/v1`, { responseType: "json" });
			result = this.handleMessage(res.response);
			await helper.sleep(1e3);
		}
		return result;
	}
	/** 通过 WebSocket 等待翻译完成，失败时降级为轮询 */
	wait(id) {
		const ws = new WebSocket(`wss://api.cotrans.touhou.ai/task/${id}/event/v1`);
		if (ws.readyState > 1) return this.waitByPolling(id);
		return new Promise((resolve, reject) => {
			ws.onmessage = (e) => {
				try {
					const result = this.handleMessage(JSON.parse(e.data));
					if (result) resolve(result);
				} catch (error) {
					reject(error);
				}
			};
		});
	}
	/** 将原图与翻译蒙版合并 */
	async mergeImage(rawImage, maskUri) {
		const img = await helper.waitImgLoad(URL.createObjectURL(rawImage));
		const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
		const canvasCtx = canvas.getContext("2d");
		canvasCtx.drawImage(img, 0, 0);
		const mask = await helper.waitImgLoad(URL.createObjectURL(await this.download(maskUri)));
		canvasCtx.drawImage(mask, 0, 0);
		return await helper.canvasToBlobUrl(canvas);
	}
	async work(blob) {
		this.setMessage(helper.t("translation.tip.upload"));
		const res = await this.upload(blob);
		const data = this.parse(res.responseText);
		const translation_mask = data.result?.translation_mask || await this.wait(data.id);
		return await this.mergeImage(blob, translation_mask);
	}
};
//#endregion
//#region src/components/Manga/actions/translation/translator/MangaImageTranslator/helper.ts
/**
* MangaImageTranslator 辅助函数
*
* 提供 API 请求、URL 构建等通用功能。
*/
/** 获取 API 基础 URL，优先使用自定义地址 */
const apiUrl = () => store.option.translation.mit?.localUrl?.replace(/\/$/u, "") || "http://127.0.0.1:5003";
/** ngrok 代理需要的特殊请求头 */
const headers$1 = helper.createRootMemo(() => {
	if (apiUrl().includes(".ngrok-free.")) return { "ngrok-skip-browser-warning": "69420" };
});
/**
* 发送 API 请求
* @param url API 路径（不含基础 URL）
* @param details 请求配置
* @param retryNum 重试次数
*/
const api = (url, details, retryNum = 0) => request.request(`${apiUrl()}${url}`, {
	...details,
	headers: {
		...details?.headers,
		...headers$1()
	}
}, retryNum);
//#endregion
//#region src/components/Manga/actions/translation/translator/MangaImageTranslator/index.ts
/**
* MangaImageTranslator 翻译任务实现
*
* 支持自部署的 manga-image-translator 服务。
* 同时兼容新旧版本 API，支持流式和非流式响应。
*
* API 文档: http://0.0.0.0:5003/docs
*/
/**
* MangaImageTranslator 翻译任务
*
* 支持自部署服务，可使用自定义服务器地址。
* 优先使用流式 API 获取实时翻译状态。
*/
var MIT = class MIT extends TranslationTask {
	isOldVersion = false;
	/** 创建上传表单数据 */
	static createFormData(blob, isOldVersion) {
		const formData = new FormData();
		const fileName = `image.${blob.type.split("/").at(-1)}`;
		const file = new File([blob], fileName, { type: blob.type });
		const { localUrl: _, ...options } = store.option.translation.mit;
		if (isOldVersion) {
			formData.append("file", file);
			formData.append("mime", file.type);
			formData.append("size", sizeDict[options.detector.detection_size]);
			formData.append("detector", options.detector.detector);
			formData.append("direction", options.render.direction);
			formData.append("translator", options.translator.translator);
			formData.append("target_lang", options.translator.target_lang);
			formData.append("retry", `${store.option.translation.forceRetry}`);
		} else {
			formData.append("image", file);
			formData.append("config", JSON.stringify(options));
		}
		return formData;
	}
	async init() {
		const res = await api("/", { errorText: `${helper.t("setting.option.paragraph_translation")} - ${helper.t("alert.server_connect_failed")}` });
		this.isOldVersion = res.responseText.includes("value=\"S\">1024px</");
	}
	/** 旧版 API：上传图片获取任务 ID */
	async oldUpload(blob) {
		try {
			return (await api("/submit", {
				method: "POST",
				responseType: "json",
				data: MIT.createFormData(blob, true)
			})).response.task_id;
		} catch (error) {
			helper.log.error(error);
			throw new Error(helper.t("translation.tip.upload_error"), { cause: error });
		}
	}
	/** 旧版 API：等待翻译完成 */
	async oldWork(blob) {
		const task_id = await this.oldUpload(blob);
		let errorNum = 0;
		let taskState;
		while (!taskState?.finished) try {
			await helper.sleep(200);
			taskState = (await api(`/task-state?taskid=${task_id}`, { responseType: "json" })).response;
			this.setMessage(helper.t(`translation.status.${taskState.state}`) || taskState.state);
		} catch (error) {
			helper.log.error(error);
			if (errorNum > 5) throw new Error(helper.t("translation.tip.check_img_status_failed"), { cause: error });
			errorNum += 1;
		}
		const res = await this.download(`${apiUrl()}/result/${task_id}`, { headers: headers$1() });
		return URL.createObjectURL(res);
	}
	/** 新版 API：通过流式接口上传 */
	async uploadByStream(blob) {
		const res = await fetch(`${apiUrl()}/translate/with-form/image/stream`, {
			method: "POST",
			headers: headers$1(),
			body: MIT.createFormData(blob, false)
		});
		if (res.status !== 200 || !res.body) throw new Error(helper.t("translation.status.error"));
		return res.body.getReader();
	}
	/** 解析流式响应，等待翻译完成 */
	async wait(reader) {
		const decoder = new TextDecoder("utf-8");
		let buffer = /* @__PURE__ */ new Uint8Array();
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer = Uint8Array.from([...buffer, ...value]);
			while (buffer.length >= 5) {
				const totalSize = 5 + new DataView(buffer.buffer).getUint32(1, false);
				if (buffer.length < totalSize) break;
				const data = buffer.slice(5, totalSize);
				switch (buffer[0]) {
					case 0: return URL.createObjectURL(new Blob([data], { type: "image/png" }));
					case 1: {
						const status = decoder.decode(data);
						if (!status.includes(":")) this.setMessage(helper.t(`translation.status.${status}`) || status);
						break;
					}
					case 2: throw new Error(`${helper.t("translation.status.error")}: ${decoder.decode(data)}`);
					case 3: {
						const pos = decoder.decode(data);
						if (pos !== "0") {
							this.setMessage(helper.t("translation.tip.pending", { pos }));
							break;
						}
					}
					case 4: this.setMessage(helper.t("translation.status.pending"));
				}
				buffer = buffer.slice(totalSize);
			}
		}
		throw new Error(helper.t("translation.status.error"));
	}
	/** 新版 API：非流式接口（当流式接口不可用时降级使用） */
	async uploadByNoStream(blob) {
		this.setMessage(helper.t("translation.tip.translating"));
		const res = await api("/translate/with-form/image", {
			method: "POST",
			responseType: "blob",
			fetch: false,
			timeout: 6e5,
			data: MIT.createFormData(blob, false),
			errorText: helper.t("translation.tip.upload_error")
		});
		return URL.createObjectURL(res.response);
	}
	async work(blob) {
		this.setMessage(helper.t("translation.tip.upload"));
		if (this.isOldVersion) return await this.oldWork(blob);
		try {
			const reader = await this.uploadByStream(blob);
			return await this.wait(reader);
		} catch (error) {
			if (error.message.includes("Failed to fetch")) return await this.uploadByNoStream(blob);
			throw error;
		}
	}
};
/** 服务支持的翻译器列表 */
const [mitTranslators, setMitTranslators] = helper.createEqualsSignal([]);
/** 从服务器获取可用翻译器列表 */
const updateMitTranslators = async (noTip = false) => {
	if (!store.option.translation.enabled) return;
	if (store.option.translation.provider !== "manga-image-translator") return;
	try {
		const res = await api("/", {
			noTip,
			errorText: `${helper.t("setting.option.paragraph_translation")} - ${helper.t("alert.server_connect_failed")}`
		});
		const translatorsText = /(?<=validTranslators: )\[.+?\](?=,)/su.exec(res.responseText)?.[0];
		if (!translatorsText) return;
		const list = JSON.parse(translatorsText.replaceAll(/\s|,\s*(?=\])/gu, ``).replaceAll(`'`, `"`));
		setMitTranslators(list.map((name) => [name, helper.t(`translation.translator.${name}`) || name]));
	} catch (error) {
		helper.log.error(helper.t("translation.tip.get_translator_list_error"), error);
		setMitTranslators([]);
	}
	if (!mitTranslators().some(([val]) => val === store.option.translation.mit.translator.translator)) {
		const translator = mitTranslators()[0]?.[0];
		setOption("translation", "mit", "translator", "translator", translator);
	}
};
helper.createEffectOn([
	() => store.option.translation.enabled,
	() => store.option.translation.provider,
	() => store.option.translation.mit.localUrl,
	helper.lang
], ([enabled, server]) => enabled && server === "manga-image-translator" && store.imgList.length > 0 && updateMitTranslators(true), { defer: true });
//#endregion
//#region src/components/Manga/index.module.css
const classes$2 = {
	"img": "img___7ajV4",
	"show": "show___HzwUa",
	"mangaFlow": "mangaFlow___jMZgq",
	"mangaBox": "mangaBox___48Jek",
	"root": "root___Hf5H2",
	"pageTip": "pageTip___P7thU",
	"endPage": "endPage___iOZmk",
	"endPageBody": "endPageBody___g-dz-",
	"tip": "tip___fyxqg",
	"jello": "jello___wXBLg",
	"comments": "comments___9ITQv",
	"toolbar": "toolbar___RMjHL",
	"toolbarPanel": "toolbarPanel___XYjgc",
	"toolbarBg": "toolbarBg___i4oTA",
	"SettingPanelPopper": "SettingPanelPopper___uEBz3",
	"SettingPanel": "SettingPanel___ZRvFB",
	"SettingBlock": "SettingBlock___qxNyt",
	"SettingBlockBody": "SettingBlockBody___Wirnd",
	"SettingBlockSubtitle": "SettingBlockSubtitle___cv0Ji",
	"SettingsItem": "SettingsItem___aJhRD",
	"SettingsShowItem": "SettingsShowItem___l-D2E",
	"SettingsItemName": "SettingsItemName___UP6zJ",
	"SettingsItemSwitch": "SettingsItemSwitch___LVGr9",
	"SettingsItemSwitchRound": "SettingsItemSwitchRound___Ds0B8",
	"SettingsItemIconButton": "SettingsItemIconButton___Cs7BQ",
	"SettingsItemSelect": "SettingsItemSelect___CvFKx",
	"closeCover": "closeCover___qLIp5",
	"SettingsShowItemBody": "SettingsShowItemBody___bgxxq",
	"hotkeys": "hotkeys___uu-Xe",
	"hotkeysItem": "hotkeysItem___d9IKS",
	"hotkeysHeader": "hotkeysHeader___jU7vr",
	"scrollbar": "scrollbar___hLToV",
	"scrollbarPage": "scrollbarPage___qghUs",
	"scrollbarSlider": "scrollbarSlider___r1fWf",
	"scrollbarPoper": "scrollbarPoper___XK5Rk",
	"touchAreaRoot": "touchAreaRoot___UN-W1",
	"touchArea": "touchArea___F6Hkh",
	"loadingMask": "loadingMask___jIxGF",
	"loadingMaskFadeIn": "loadingMaskFadeIn___abNXH",
	"loadingMaskBlink": "loadingMaskBlink___O8MCV",
	"hidden": "hidden___rxU-6",
	"invisible": "invisible___cO-hs",
	"beautifyScrollbar": "beautifyScrollbar___lb6kJ"
};
//#endregion
//#region src/components/Manga/components/SettingsItem.tsx
var _tmpl$$44 = /*#__PURE__*/ solid_js_web.template(`<div><div> <!> `);
/** 设置菜单项 */
const SettingsItem = (props) => (() => {
	var _el$ = _tmpl$$44(), _el$2 = _el$.firstChild, _el$5 = _el$2.firstChild.nextSibling;
	_el$5.nextSibling;
	solid_js_web.insert(_el$2, () => props.name, _el$5);
	solid_js_web.insert(_el$, () => props.children, null);
	solid_js_web.effect((_p$) => {
		var _v$ = props.class ? `${classes$2.SettingsItem} ${props.class}` : classes$2.SettingsItem, _v$2 = {
			[props.class ?? ""]: Boolean(props.class?.length),
			...props.classList
		}, _v$3 = props.style, _v$4 = helper.boolDataVal(props.disabled), _v$5 = classes$2.SettingsItemName;
		_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
		_p$.t = solid_js_web.classList(_el$, _v$2, _p$.t);
		_p$.a = solid_js_web.style(_el$, _v$3, _p$.a);
		_v$4 !== _p$.o && solid_js_web.setAttribute(_el$, "data-disabled", _p$.o = _v$4);
		_v$5 !== _p$.i && solid_js_web.className(_el$2, _p$.i = _v$5);
		return _p$;
	}, {
		e: void 0,
		t: void 0,
		a: void 0,
		o: void 0,
		i: void 0
	});
	return _el$;
})();
//#endregion
//#region src/components/Manga/components/SettingsItemSelect.tsx
var _tmpl$$43 = /*#__PURE__*/ solid_js_web.template(`<select>`);
var _tmpl$2$9 = /*#__PURE__*/ solid_js_web.template(`<option>`);
/** 选择器式菜单项 */
const SettingsItemSelect = (props) => {
	let ref;
	solid_js.createEffect(() => {
		ref.value = props.options?.some(([val]) => val === props.value) ? props.value : "";
	});
	return solid_js_web.createComponent(SettingsItem, {
		get name() {
			return props.name;
		},
		get ["class"]() {
			return props.class;
		},
		get classList() {
			return props.classList;
		},
		get children() {
			var _el$ = _tmpl$$43();
			solid_js_web.addEventListener(_el$, "click", () => props.onClick?.());
			_el$.addEventListener("change", (e) => props.onChange(e.target.value));
			var _ref$ = ref;
			typeof _ref$ === "function" ? solid_js_web.use(_ref$, _el$) : ref = _el$;
			solid_js_web.insert(_el$, solid_js_web.createComponent(solid_js.For, {
				get each() {
					return props.options;
				},
				children: ([val, label]) => (() => {
					var _el$2 = _tmpl$2$9();
					_el$2.value = val;
					solid_js_web.insert(_el$2, label ?? val);
					return _el$2;
				})()
			}));
			solid_js_web.effect(() => solid_js_web.className(_el$, classes$2.SettingsItemSelect));
			return _el$;
		}
	});
};
//#endregion
//#region src/components/Manga/actions/translation/translator/Cotrans/settings.tsx
var _tmpl$$42 = /*#__PURE__*/ solid_js_web.template(`<blockquote>`);
const bindOption$3 = (...args) => bindOption("translation", "cotrans", ...args);
/** Cotrans 设置组件 */
const cotransSettings = () => [
	(() => {
		var _el$ = _tmpl$$42();
		solid_js_web.effect(() => _el$.innerHTML = helper.t("setting.translation.cotrans_tip"));
		return _el$;
	})(),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.target_language");
		},
		options: targetLanguageOptions
	}, () => bindOption$3("translator", "target_lang"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.translator");
		},
		get options() {
			return cotransTranslators.map((name) => [name, helper.t(`translation.translator.${name}`) || name]);
		}
	}, () => bindOption$3("translator", "translator"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.direction");
		},
		get options() {
			return [
				["auto", helper.t("setting.translation.options.direction_auto")],
				["horizontal", helper.t("setting.translation.options.direction_horizontal")],
				["vertical", helper.t("setting.translation.options.direction_vertical")]
			];
		}
	}, () => bindOption$3("render", "direction"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.detection_resolution");
		},
		options: [
			["1024", "1024px"],
			["1536", "1536px"],
			["2048", "2048px"],
			["2560", "2560px"]
		]
	}, () => bindOption$3("detector", "detection_size"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.text_detector");
		},
		options: [["default"], ["ctd", "Comic Text Detector"]]
	}, () => bindOption$3("detector", "detector")))
];
//#endregion
//#region src/components/NumberInput.tsx
var _tmpl$$41 = /*#__PURE__*/ solid_js_web.template(`<span contenteditable data-only-number>`);
/** 数值输入框 */
const NumberInput = (props) => {
	const handleInput = (e) => {
		const target = e.currentTarget;
		if (props.maxLength === void 0 || target.textContent.length <= props.maxLength) return;
		target.textContent = target.textContent.slice(0, props.maxLength);
		target.blur();
	};
	const handleKeyDown = (e) => {
		switch (e.key) {
			case "ArrowUp": return props.onChange((Number(e.target.textContent) * 1e3 + (props.step ?? 1) * 1e3) / 1e3);
			case "ArrowDown": return props.onChange((Number(e.target.textContent) * 1e3 - (props.step ?? 1) * 1e3) / 1e3);
			case "Enter": return e.target.blur();
		}
	};
	return [(() => {
		var _el$ = _tmpl$$41();
		_el$.addEventListener("blur", (e) => {
			try {
				props.onChange(Number(e.currentTarget.textContent) || 0);
			} finally {
				e.currentTarget.textContent = `${props.value}`;
			}
		});
		solid_js_web.addEventListener(_el$, "keydown", handleKeyDown);
		solid_js_web.addEventListener(_el$, "input", handleInput);
		solid_js_web.insert(_el$, () => `${props.value}`);
		return _el$;
	})(), solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return props.suffix;
		},
		get children() {
			return props.suffix;
		}
	})];
};
//#endregion
//#region src/components/Manga/components/SettingsItemNumber.tsx
var _tmpl$$40 = /*#__PURE__*/ solid_js_web.template(`<div>`);
/** 数值输入框菜单项 */
const SettingsItemNumber = (props) => solid_js_web.createComponent(SettingsItem, {
	get name() {
		return props.name;
	},
	get ["class"]() {
		return props.class;
	},
	get classList() {
		return props.classList;
	},
	get children() {
		var _el$ = _tmpl$$40();
		solid_js_web.insert(_el$, solid_js_web.createComponent(NumberInput, props));
		solid_js_web.effect((_$p) => solid_js_web.setStyleProperty(_el$, "margin-right", props.suffix ? ".3em" : ".6em"));
		return _el$;
	}
});
//#endregion
//#region src/components/Manga/components/SettingsItemSwitch.tsx
var _tmpl$$39 = /*#__PURE__*/ solid_js_web.template(`<button type=button><div>`);
/** 开关式菜单项 */
const SettingsItemSwitch = (props) => {
	const handleClick = () => props.onChange(!props.value);
	return solid_js_web.createComponent(SettingsItem, {
		get name() {
			return props.name;
		},
		get ["class"]() {
			return props.class;
		},
		get classList() {
			return props.classList;
		},
		get disabled() {
			return props.disabled;
		},
		get children() {
			var _el$ = _tmpl$$39(), _el$2 = _el$.firstChild;
			solid_js_web.addEventListener(_el$, "click", handleClick);
			solid_js_web.effect((_p$) => {
				var _v$ = classes$2.SettingsItemSwitch, _v$2 = props.value, _v$3 = classes$2.SettingsItemSwitchRound;
				_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
				_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "data-checked", _p$.t = _v$2);
				_v$3 !== _p$.a && solid_js_web.className(_el$2, _p$.a = _v$3);
				return _p$;
			}, {
				e: void 0,
				t: void 0,
				a: void 0
			});
			return _el$;
		}
	});
};
//#endregion
//#region src/components/Manga/actions/translation/translator/MangaImageTranslator/settings.tsx
/**
* MangaImageTranslator 翻译服务设置界面
*/
var _tmpl$$38 = /*#__PURE__*/ solid_js_web.template(`<input type=url>`);
const bindOption$2 = (...args) => bindOption("translation", "mit", ...args);
/** MangaImageTranslator 设置组件 */
const mitSettings = () => [
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.target_language");
		},
		options: targetLanguageOptions
	}, () => bindOption$2("translator", "target_lang"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.translator");
		},
		get options() {
			return mitTranslators();
		},
		onClick: updateMitTranslators
	}, () => bindOption$2("translator", "translator"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.direction");
		},
		get options() {
			return [
				["auto", helper.t("setting.translation.options.direction_auto")],
				["horizontal", helper.t("setting.translation.options.direction_horizontal")],
				["vertical", helper.t("setting.translation.options.direction_vertical")]
			];
		}
	}, () => bindOption$2("render", "direction"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.detection_resolution");
		},
		options: [
			["1024", "1024px"],
			["1536", "1536px"],
			["2048", "2048px"],
			["2560", "2560px"]
		]
	}, () => bindOption$2("detector", "detection_size"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.text_detector");
		},
		options: [["default"], ["ctd", "Comic Text Detector"]]
	}, () => bindOption$2("detector", "detector"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.inpainting_size");
		},
		options: [
			["516", "516px"],
			["1024", "1024px"],
			["2048", "2048px"],
			["2560", "2560px"]
		]
	}, () => bindOption$2("inpainter", "inpainting_size"))),
	solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.inpainter");
		},
		options: [
			["default", "Default"],
			["lama_large", "Lama Large"],
			["lama_mpe", "Lama MPE"],
			["sd", "SD"],
			["none", "None"],
			["original", "Original"]
		]
	}, () => bindOption$2("inpainter", "inpainter"))),
	solid_js_web.createComponent(SettingsItemNumber, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.unclip_ratio");
		},
		step: .01
	}, () => bindOption$2("detector", "unclip_ratio"))),
	solid_js_web.createComponent(SettingsItemNumber, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.translation.options.box_threshold");
		},
		step: .01
	}, () => bindOption$2("detector", "box_threshold"))),
	solid_js_web.createComponent(SettingsItemNumber, solid_js_web.mergeProps({ get name() {
		return helper.t("setting.translation.options.mask_dilation_offset");
	} }, () => bindOption$2("mask_dilation_offset"))),
	solid_js_web.createComponent(SettingsItemSwitch, {
		get name() {
			return helper.t("setting.translation.options.local_url");
		},
		get value() {
			return store.option.translation.mit.localUrl !== void 0;
		},
		onChange: (val) => {
			setOption("translation", "mit", "localUrl", val ? "" : void 0);
		}
	}),
	solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return store.option.translation.mit.localUrl !== void 0;
		},
		get children() {
			var _el$ = _tmpl$$38();
			_el$.addEventListener("change", (e) => {
				const url = e.target.value.replace(/\/$/u, "");
				setOption("translation", "mit", "localUrl", url);
			});
			solid_js_web.effect(() => _el$.value = store.option.translation.mit.localUrl);
			return _el$;
		}
	})
];
//#endregion
//#region src/components/Manga/actions/translation/index.ts
/** 判断当前翻译器是否允许批量翻译 */
const allowBatchTranslation = () => store.option.translation.provider !== "cotrans";
const taskRegistry = {
	"manga-image-translator": MIT,
	cotrans: Cotrans
};
const setMessage = (url, message) => setState("imgMap", url, "translationMessage", message);
/** 翻译指定图片 */
const translationImage = async (url) => {
	try {
		if (!url) return;
		const img = store.imgMap[url];
		if (img.translationType !== "wait") return;
		if (img.translationUrl) return setState("imgMap", url, "translationType", "show");
		if (img.loadType !== "loaded") return setMessage(url, helper.t("translation.tip.img_not_fully_loaded"));
		const Task = taskRegistry[store.option.translation.provider];
		if (!Task) throw new Error("未知翻译器");
		const translationUrl = await new Task(url).run();
		setState("imgMap", url, {
			translationUrl,
			translationMessage: helper.t("translation.tip.translation_completed"),
			translationType: "show"
		});
	} catch (error) {
		setState("imgMap", url, "translationType", "error");
		if (error?.message) setState("imgMap", url, "translationMessage", error.message);
	}
};
/** 逐个翻译状态为等待翻译的图片 */
const translationAll = helper.singleThreaded(async (state) => {
	if (!store.option.translation.enabled) return;
	const targetImg = imgList().find((img) => img.translationType === "wait" && img.loadType === "loaded");
	if (!targetImg) return;
	await translationImage(targetImg.src);
	state.continueRun();
});
/** 开启或关闭指定图片的翻译 */
const setImgTranslationEnbale = (list, enable) => {
	if (!store.option.translation.enabled && enable) return;
	setState((state) => {
		for (const i of list) {
			const img = state.imgMap[state.imgList[i]];
			if (!img) continue;
			const url = img.src;
			if (enable) {
				if (state.option.translation.forceRetry) {
					img.translationType = "wait";
					img.translationUrl = void 0;
					setMessage(url, helper.t("translation.tip.wait_translation"));
				} else switch (img.translationType) {
					case "hide":
						img.translationType = "show";
						break;
					case "error":
					case void 0:
						img.translationType = "wait";
						setMessage(url, helper.t("translation.tip.wait_translation"));
				}
			} else switch (img.translationType) {
				case "show":
					img.translationType = "hide";
					break;
				case "error":
				case "wait": img.translationType = void 0;
			}
		}
	});
	return translationAll();
};
/** 翻译范围的图片 */
const translationImgs = helper.createRootMemo(() => {
	const list = /* @__PURE__ */ new Set();
	for (const [i, img] of imgList().entries()) switch (img.translationType) {
		case "error":
		case "show":
		case "wait": list.add(i);
	}
	return list;
});
/** 当前显示的图片是否正在翻译 */
const isTranslatingImage = helper.createRootMemo(() => activePage().some((i) => translationImgs().has(i)));
/** 翻译当前页 */
const translateCurrent = () => setImgTranslationEnbale(activePage(), !isTranslatingImage());
const createTranslateRange = (imgs) => {
	const isTranslating = helper.createRootMemo(() => imgs().every((i) => translationImgs().has(i)));
	const translateRange = () => {
		if (!allowBatchTranslation()) return;
		setImgTranslationEnbale(imgs(), !isTranslating());
	};
	return [isTranslating, translateRange];
};
const [isTranslatingAll, translateAll] = createTranslateRange(helper.createRootMemo(() => helper.range(store.imgList.length)));
const [isTranslatingToEnd, translateToEnd] = createTranslateRange(helper.createRootMemo(() => helper.range(activeImgIndex(), store.imgList.length)));
//#endregion
//#region src/components/Manga/actions/imageLoad/reactor.ts
/** 重新加载错误图片 */
const reloadImg = (url) => {
	if (store.imgMap[url]?.loadType !== "error") return;
	setState("imgMap", url, "loadType", "wait");
	updateImgLoadType();
};
/** 图片加载失败后定时重新加载 */
const handleTimeReload = (url) => {
	const count = loadState.imgErrorMap.get(url) || 0;
	if (count > 8) return;
	loadState.imgErrorMap.set(url, count + 1);
	const time = (2 ** count + Math.random() * 2) * 1e3;
	setTimeout(reloadImg, time, url);
};
/** 图片加载完毕的回调 */
const handleImgLoaded = (url, e) => {
	loadState.imgErrorMap.delete(url);
	const img = store.imgMap[url];
	if (!img) return;
	if (img.translationType === "show") return;
	if (img.loadType !== "loaded") {
		setState("imgMap", url, "loadType", "loaded");
		loadState.unloadedUrlSet.delete(url);
		loadState.loadingUrlSet.delete(url);
		updateImgLoadType();
		store.prop.onLoading?.(imgList(), store.imgMap[url]);
	}
	if (!e) return;
	updateImgSize(url, e.naturalWidth, e.naturalHeight);
	if (store.option.imgRecognition.enabled && e.src === img.blobUrl && isInRenderRange(url)) setTimeout(handleImgRecognition, 0, url, e);
	if (store.option.translation.enabled) translationAll();
};
/** 图片加载出错的回调 */
const handleImgError = (url, e) => {
	if (e && !e.isConnected) return;
	setState((state) => {
		const img = state.imgMap[url];
		if (!img) return;
		helper.log.error(getImgIndexs(url), helper.t("alert.img_load_failed"), e);
		img.loadType = "error";
		img.type = void 0;
	});
	loadState.loadingUrlSet.delete(url);
	handleTimeReload(url);
	store.prop.onLoading?.(imgList(), store.imgMap[url]);
	store.prop.onImgError?.(url);
	updateImgLoadType();
};
helper.createEffectOn(showImgList, helper.debounce((list) => {
	if (loadState.imgErrorMap.size === 0) return;
	for (const i of list) reloadImg(getImg(i).src);
}, 500), { defer: true });
const timeoutAbort = (url) => {
	if (!loadState.abortMap.has(url)) return;
	loadState.abortMap.get(url).abort();
	loadState.abortMap.delete(url);
	handleImgError(url);
};
helper.createEffectOn(() => new Set(loadState.loadingUrlSet), (downImgList, prevImgList) => {
	if (!store.option.imgRecognition.enabled) return;
	if (prevImgList) for (const url of prevImgList) {
		if (downImgList.has(url) || !loadState.abortMap.has(url)) continue;
		loadState.abortMap.get(url)?.abort();
		loadState.abortMap.delete(url);
		helper.log(`中断下载 ${url}`);
	}
	for (const url of downImgList) {
		if (loadState.abortMap.has(url) || store.imgMap[url].blobUrl) continue;
		const controller = new AbortController();
		const handleTimeout = helper.debounce(() => timeoutAbort(url), 3e3);
		controller.signal.addEventListener("abort", handleTimeout.clear);
		loadState.abortMap.set(url, controller);
		handleTimeout();
		request.request(url, {
			responseType: "blob",
			retryFetch: true,
			signal: controller.signal,
			timeout: void 0,
			noTip: true,
			headers: request.downloadImgHeaders,
			onerror: () => handleImgError(url),
			onprogress({ loaded, total }) {
				if (!Reflect.has(store.imgMap, url)) return;
				setState("imgMap", url, "progress", loaded / total * 100);
				handleTimeout();
			},
			onload({ response }) {
				loadState.abortMap.delete(url);
				if (!Reflect.has(store.imgMap, url)) return;
				setState("imgMap", url, {
					blobUrl: URL.createObjectURL(response),
					progress: void 0
				});
				handleImgLoaded(url);
			}
		});
	}
});
//#endregion
//#region src/components/Manga/actions/zoom.ts
const touches = /* @__PURE__ */ new Map();
const bound = helper.createMemoMap({
	x: () => -store.rootSize.width * (store.option.zoom.ratio / 100 - 1),
	y: () => -store.rootSize.height * (store.option.zoom.ratio / 100 - 1)
});
const checkBound = (state) => {
	state.option.zoom.offset.x = helper.clamp(bound().x, state.option.zoom.offset.x, 0);
	state.option.zoom.offset.y = helper.clamp(bound().y, state.option.zoom.offset.y, 0);
};
const zoom = (val, focal, animation = false) => {
	const newScale = helper.clamp(100, val, 300);
	if (newScale === store.option.zoom.ratio) return;
	const { left, top } = refs.mangaBox.getBoundingClientRect();
	const x = (focal?.x ?? store.rootSize.width / 2) - left;
	const y = (focal?.y ?? store.rootSize.height / 2) - top;
	const newX = x / (store.option.zoom.ratio / 100) * (newScale / 100);
	const newY = y / (store.option.zoom.ratio / 100) * (newScale / 100);
	const dx = newX - x;
	const dy = newY - y;
	setOption((draftOption, state) => {
		draftOption.zoom.ratio = newScale;
		draftOption.zoom.offset.x -= dx;
		draftOption.zoom.offset.y -= dy;
		checkBound(state);
		if (animation) state.page.anima = "zoom";
	});
};
/** 摩擦系数 */
const FRICTION_COEFF$1 = .91;
/** 逐帧根据鼠标坐标移动元素，并计算速率 */
const zoomDragAnim = new class extends helper.AnimationFrame {
	mouse = {
		x: 0,
		y: 0
	};
	last = {
		x: 0,
		y: 0
	};
	velocity = {
		x: 0,
		y: 0
	};
	frame = () => {
		if (this.mouse.x === store.option.zoom.offset.x && this.mouse.y === store.option.zoom.offset.y) {
			this.animationId = 0;
			return;
		}
		setOption((draftOption, state) => {
			this.last.x = draftOption.zoom.offset.x;
			this.last.y = draftOption.zoom.offset.y;
			draftOption.zoom.offset.x = this.mouse.x;
			draftOption.zoom.offset.y = this.mouse.y;
			checkBound(state);
			this.velocity.x = draftOption.zoom.offset.x - this.last.x;
			this.velocity.y = draftOption.zoom.offset.y - this.last.y;
		});
		this.call(true);
	};
	/** 一段时间没有移动后应该将速率归零 */
	resetVelocity = helper.debounce(() => {
		this.velocity.x = 0;
		this.velocity.y = 0;
	}, 200);
}();
/** 逐帧计算惯性滑动 */
const zoomSlideAnim = new class extends helper.AnimationFrame {
	lastTime = 0;
	frame = (timestamp) => {
		if (helper.approx(zoomDragAnim.velocity.x, 0, 1) && helper.approx(zoomDragAnim.velocity.y, 0, 1)) {
			this.animationId = 0;
			return;
		}
		setOption((draftOption, state) => {
			draftOption.zoom.offset.x += zoomDragAnim.velocity.x;
			draftOption.zoom.offset.y += zoomDragAnim.velocity.y;
			checkBound(state);
			if (timestamp - this.lastTime > 16) {
				zoomDragAnim.velocity.x *= FRICTION_COEFF$1;
				zoomDragAnim.velocity.y *= FRICTION_COEFF$1;
				this.lastTime = timestamp;
			}
		});
		this.call(true);
	};
}();
/** 是否正在双指捏合缩放中 */
let pinchZoom = false;
/** 处理放大后的拖拽移动 */
const handleZoomDrag = ({ type, xy: [x, y], last: [lx, ly] }) => {
	if (store.option.zoom.ratio === 100) return;
	switch (type) {
		case "down":
			zoomDragAnim.velocity.x = 0;
			zoomDragAnim.velocity.y = 0;
			zoomDragAnim.mouse.x = store.option.zoom.offset.x;
			zoomDragAnim.mouse.y = store.option.zoom.offset.y;
			zoomSlideAnim.cancel();
			zoomDragAnim.cancel();
			break;
		case "move":
			zoomDragAnim.cancel();
			zoomDragAnim.mouse.x += x - lx;
			zoomDragAnim.mouse.y += y - ly;
			zoomDragAnim.call();
			zoomDragAnim.resetVelocity();
			break;
		case "up":
			zoomDragAnim.resetVelocity.clear();
			if (pinchZoom) {
				pinchZoom = false;
				zoomDragAnim.mouse.x = store.option.zoom.offset.x;
				zoomDragAnim.mouse.y = store.option.zoom.offset.y;
				return;
			}
			zoomDragAnim.cancel();
			zoomSlideAnim.call();
	}
};
/** 获取两个指针之间的距离 */
const getDistance = (a, b) => Math.hypot(b.xy[0] - a.xy[0], b.xy[1] - a.xy[1]);
/** 逐帧计算当前屏幕上两点之间的距离，并换算成缩放比例 */
const pinchZoomAnim = new class extends helper.AnimationFrame {
	initDistance = 0;
	initScale = 100;
	frame = () => {
		if (touches.size < 2) {
			this.animationId = 0;
			return;
		}
		const [a, b] = [...touches.values()];
		const distance = getDistance(a, b);
		zoom(distance / this.initDistance * this.initScale, {
			x: (a.xy[0] + b.xy[0]) / 2,
			y: (a.xy[1] + b.xy[1]) / 2
		});
		this.call(true);
	};
}();
/** 处理双指捏合缩放 */
const handlePinchZoom = ({ type }) => {
	if (touches.size < 2) return;
	switch (type) {
		case "down": {
			pinchZoom = true;
			const [a, b] = [...touches.values()];
			pinchZoomAnim.initDistance = getDistance(a, b);
			pinchZoomAnim.initScale = store.option.zoom.ratio;
			break;
		}
		case "up": {
			const [a, b] = [...touches.values()];
			pinchZoomAnim.initDistance = getDistance(a, b);
			break;
		}
		case "move":
			pinchZoomAnim.call();
			break;
		case "cancel": {
			const [a, b] = [...touches.values()];
			pinchZoomAnim.initDistance = getDistance(a, b);
			break;
		}
	}
};
//#endregion
//#region src/components/Manga/actions/scroll.ts
const _scrollTo = (top) => {
	const val = helper.clamp(0, top, contentHeight() - store.rootSize.height);
	refs.mangaBox.scrollTo({
		top: val,
		behavior: "instant"
	});
	setState((state) => {
		state.scrollTop = val;
		openScrollLock(state);
	});
};
/** 在卷轴模式下滚动到指定进度 */
const scrollTo = (x, smooth = false) => {
	if (!store.option.scrollMode.enabled) return;
	if (store.option.scrollMode.abreastMode) {
		_scrollTo(0);
		const val = helper.clamp(0, x, abreastScrollWidth());
		return setState("page", "offset", "x", "px", val);
	}
	if (!smooth) {
		scrollStep.cancel();
		return _scrollTo(x);
	}
	if (store.option.scrollDuration <= 0) {
		scrollStep.cancel();
		return _scrollTo(x);
	}
	if (scrollStep.animationId) {
		scrollStep.cancel();
		_scrollTo(x);
	}
	scrollStep.start(x);
};
/** 在卷轴模式下滚动指定进度 */
const scrollBy = (offset, smooth = false) => {
	if (!store.option.scrollMode.enabled) return;
	if (handleEndTurnPage(offset > 0 ? "next" : "prev")) return;
	return scrollTo(scrollTop() + offset, smooth);
};
/** 实现卷轴模式下的平滑滚动 */
const scrollStep = new class extends helper.AnimationFrame {
	/** 动画时长 */
	duration = 0;
	/** 要滚动的距离 */
	distance = 0;
	/** 滚动开始时间 */
	startTime = 0;
	/** 滚动开始位置 */
	startTop = 0;
	scrollTo = (top) => {
		if (helper.inRange(0, top, scrollLength())) scrollTo(top);
		else this.cancel();
	};
	frame = (timestamp) => {
		this.cancel();
		this.startTime ||= timestamp;
		/** 已滚动时间 */
		const elapsed = timestamp - this.startTime;
		if (elapsed >= this.duration) return this.scrollTo(this.startTop + this.distance);
		this.scrollTo(this.startTop + elapsed / this.duration * this.distance);
		this.call(true);
	};
	start = (x) => {
		this.duration = store.option.scrollDuration;
		this.startTime = 0;
		this.startTop = scrollTop();
		this.distance = x - this.startTop;
		this.frame(0);
	};
}();
/** 实现卷轴模式下的匀速滚动 */
const constantScroll = new class extends helper.AnimationFrame {
	speed = 0;
	lastTime = 0;
	onScroll;
	scrollTo = (top) => {
		if (helper.inRange(0, top, scrollLength())) scrollTo(top);
		else this.cancel();
	};
	frame = (timestamp) => {
		if (!this.animationId) return;
		const scrollDelta = this.lastTime ? this.speed * (timestamp - this.lastTime) : 0;
		this.lastTime = timestamp;
		if (this.onScroll?.(scrollDelta) === false) return this.cancel();
		this.scrollTo(scrollTop() + scrollDelta);
		this.call(true);
	};
	start = (speed, onScroll) => {
		if (this.animationId && speed === this.speed && this.onScroll === onScroll) return;
		this.cancel();
		this.speed = speed;
		this.onScroll = onScroll;
		this.lastTime = 0;
		this.call();
	};
}();
/** 保存当前滚动进度，并在之后恢复 */
const saveScrollProgress = () => {
	const oldScrollPercentage = scrollPercentage();
	return () => scrollTo(oldScrollPercentage * scrollLength());
};
/** 在卷轴模式下，滚动到能显示指定图片的位置 */
const scrollViewImg = (i) => {
	if (!store.option.scrollMode.enabled) return;
	let top;
	if (store.option.scrollMode.abreastMode) top = abreastArea().columns.findIndex((column) => column.includes(i)) * abreastColumnWidth() + 1;
	else top = pageTopList()[i] + 1;
	scrollTo(top);
};
/** 跳转到指定图片的显示位置 */
const jumpToImg = (index) => {
	zoom(100);
	if (store.option.scrollMode.enabled) return scrollViewImg(index);
	const pageNum = imgPageMap()[index];
	if (pageNum === void 0) return;
	setState("activePageIndex", pageNum);
};
//#endregion
//#region src/components/Manga/actions/jumpToPage.ts
/** 弹窗跳转到指定页数（页数按图片序号计算，范围为 1 ~ imgList.length） */
const jumpToPage = async () => {
	const total = store.imgList.length;
	if (total === 0) return;
	const input = await components_InputDialog.askInput({
		message: helper.t("other.jump_page_message"),
		tip: helper.t("other.range_tip", { total }),
		defaultValue: `${activeImgIndex() + 1}`,
		type: "number"
	});
	if (input === null) return;
	const index = Number(input.trim()) - 1;
	if (!helper.inRange(0, index, total - 1)) {
		components_Toast.toast.error(helper.t("other.jump_page_invalid"));
		await helper.sleep(200);
		return jumpToPage();
	}
	if (index === activeImgIndex()) return;
	jumpToImg(index);
};
//#endregion
//#region src/components/Manga/actions/switch.ts
/** 切换页面填充 */
const switchFillEffect = () => {
	setState((state) => {
		if (state.pageList[state.activePageIndex].length !== 2) return;
		state.fillEffect[nowFillIndex()] = Number(!state.fillEffect[nowFillIndex()]);
		updatePageData(state);
	});
};
/** 切换卷轴模式 */
const switchScrollMode = () => {
	const index = activeImgIndex();
	zoom(100);
	setOption((draftOption, state) => {
		draftOption.scrollMode.enabled = !draftOption.scrollMode.enabled;
		state.page.offset.x.px = 0;
		state.page.offset.y.px = 0;
	});
	jumpToImg(index);
};
/** 切换单双页模式 */
const switchOnePageMode = () => {
	const index = activeImgIndex();
	setOption((draftOption, state) => {
		if (draftOption.scrollMode.enabled) {
			if (draftOption.scrollMode.abreastMode) {
				draftOption.scrollMode.abreastMode = false;
				draftOption.scrollMode.doubleMode = true;
			} else draftOption.scrollMode.doubleMode = !draftOption.scrollMode.doubleMode;
		} else {
			const newPageNum = pageNum() === 1 ? 2 : 1;
			draftOption.pageNum = state.option.autoSwitchPageMode && newPageNum === autoPageNum() ? 0 : newPageNum;
		}
	});
	jumpToImg(index);
};
/** 切换阅读方向 */
const switchDir = () => setOption("dir", store.option.dir === "rtl" ? "ltr" : "rtl");
/** 切换全屏 */
const switchFullscreen = () => {
	if (document.fullscreenElement) return document.exitFullscreen();
	return refs.root.requestFullscreen();
};
/** 切换自动滚动 */
const switchAutoScroll = () => {
	if (store.autoScroll.play) return stopAutoScroll();
	// This edition's Play button always means continuous downward reading.
	setOption((option) => {
		option.scrollMode.enabled = true;
		option.scrollMode.abreastMode = false;
		option.autoScroll.continuous = true;
	});
	if (clickTimeout) {
		clearTimeout(clickTimeout);
		clickTimeout = null;
	}
	setState((state) => {
		resetUI(state);
		state.autoScroll.play = true;
	});
};
/** 停止自动滚动 */
const stopAutoScroll = () => {
	autoScroll.cancel();
	if (!store.autoScroll.play) return;
	setState("autoScroll", "play", false);
	constantScroll.cancel();
};
/** 切换图片识别相关功能 */
const switchImgRecognition = (...path) => {
	const onlyUpscale = path.length === 1 && path[0] === "upscale";
	setOption((draftOption, state) => {
		const option = draftOption.imgRecognition;
		if (path.length === 0) path.push("enabled");
		for (const key of path) option[key] = !option[key];
		if (!option.enabled) return syncImgLoadState(state);
		for (const img of Object.values(state.imgMap)) if (!img.blobUrl) img.loadType = "wait";
		syncImgLoadState(state);
		if (path.includes("enabled")) updateImgLoadType();
	});
	if (!onlyUpscale) invalidateRecognition();
};
//#endregion
//#region src/components/Manga/actions/turnPage.ts
/** 翻页。返回是否成功改变了当前页数 */
const turnPage = withOptionalState((dir, state) => {
	if (state.option.scrollMode.enabled) return false;
	if (handleEndTurnPage(dir, state)) return false;
	state.activePageIndex += dir === "next" ? 1 : -1;
	return true;
});
/** 判断翻页方向 */
const getTurnPageDir = (move, total, startTime) => {
	let dir;
	if (!startTime) {
		if (Math.abs(move) > total / 2) dir = move > 0 ? "next" : "prev";
		return dir;
	}
	if (Math.abs(move) > total / 3) dir = move > 0 ? "next" : "prev";
	if (dir) return dir;
	const velocity = move / (performance.now() - startTime);
	if (velocity < -.4) dir = "prev";
	if (velocity > .4) dir = "next";
	return dir;
};
//#endregion
//#region src/components/Manga/actions/turnPageAnimator.ts
/** 拖动松手翻页动画时长（固定） */
const DRAG_TURN_ANIMATION_DURATION = 100;
/** 缓动函数：先慢后快再慢 */
const easeInOutCubic = (t) => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
/** 将 mangaFlow 偏移到指定页在 renderRange 中的位置 */
const setOffsetToPage = (state, pageIndex) => {
	const i = pageIndex - state.renderRange[0];
	state.page.offset.x.pct = state.page.vertical ? 0 : i;
	state.page.offset.y.pct = state.page.vertical ? -i : 0;
	state.page.offset.x.px = 0;
	state.page.offset.y.px = 0;
};
/** 计算翻页动画的起点偏移（像素） */
const getTurnStartOffsets = ({ state, oldIndex, oldRenderRange, oldOffset }) => {
	const [rangeStart, rangeEnd] = state.renderRange;
	const startIndex = helper.clamp(oldIndex, rangeStart, rangeEnd);
	if (oldIndex >= rangeStart && oldIndex <= rangeEnd) {
		const size = state.page.vertical ? state.rootSize.height : state.rootSize.width;
		const oldInternal = state.page.vertical ? oldOffset.y.pct * size + oldOffset.y.px : oldOffset.x.pct * size + oldOffset.x.px;
		const oldAbs = oldRenderRange[0] + (state.page.vertical ? -oldInternal / size : oldInternal / size);
		const startInternal = state.page.vertical ? helper.clamp(-(oldAbs - rangeStart) * size, -(rangeEnd - rangeStart) * size, 0) : helper.clamp((oldAbs - rangeStart) * size, 0, (rangeEnd - rangeStart) * size);
		return {
			x: state.page.vertical ? 0 : startInternal,
			y: state.page.vertical ? startInternal : 0
		};
	}
	setOffsetToPage(state, startIndex);
	return {
		x: state.page.offset.x.pct * state.rootSize.width + state.page.offset.x.px,
		y: state.page.offset.y.pct * state.rootSize.height + state.page.offset.y.px
	};
};
const turnPageAnimator = new class extends helper.AnimationFrame {
	/** 动画令牌，用于丢弃失效的帧回调 */
	token = 0;
	/** 本次动画时长 */
	duration = 0;
	/** 本次动画开始时间 */
	startTime = 0;
	/** 起点偏移（像素） */
	from = {
		x: 0,
		y: 0
	};
	/** 终点偏移（像素） */
	to = {
		x: 0,
		y: 0
	};
	/** 终点页对应的 pct，动画期间保持该值不变 */
	toPct = {
		x: 0,
		y: 0
	};
	frame = (timestamp) => {
		const { token } = this;
		if (this.startTime === 0) this.startTime = timestamp;
		const elapsed = timestamp - this.startTime;
		const progress = Math.min(1, elapsed / this.duration);
		const t = easeInOutCubic(progress);
		const x = this.from.x + (this.to.x - this.from.x) * t;
		const y = this.from.y + (this.to.y - this.from.y) * t;
		setState((state) => {
			if (token !== this.token) return;
			state.page.offset.x.pct = this.toPct.x;
			state.page.offset.y.pct = this.toPct.y;
			state.page.offset.x.px = x - this.toPct.x * state.rootSize.width;
			state.page.offset.y.px = y - this.toPct.y * state.rootSize.height;
		});
		if (progress >= 1) {
			this.finish();
			return;
		}
		if (token === this.token) this.call(true);
	};
	start = (dir, duration = store.option.turnPageDuration) => {
		if (store.option.scrollMode.enabled) {
			turnPage(dir);
			return;
		}
		if (duration <= 0) {
			this.turnDirectly(dir);
			return;
		}
		if (store.isTurnAnimating) this.finish();
		this.cancel();
		this.token += 1;
		if (!this.prepareTurn(dir)) return;
		this.duration = duration;
		this.startTime = 0;
		this.call();
	};
	/** 直接翻页 */
	turnDirectly = (dir) => {
		this.cancel();
		this.token += 1;
		setState((state) => {
			if (state.option.scrollMode.enabled) return turnPage(dir, state);
			if (!turnPage(dir, state)) {
				state.isTurnAnimating = false;
				state.isDragMode = false;
				resetPage(state, true);
				state.page.offset.x.px = 0;
				state.page.offset.y.px = 0;
				return;
			}
			state.isTurnAnimating = false;
			state.isDragMode = false;
			state.page.offset.x.px = 0;
			state.page.offset.y.px = 0;
			resetPage(state, false);
		});
	};
	/** 准备一次动画：翻页并计算起点/终点偏移。返回是否成功 */
	prepareTurn = (dir) => {
		let success = false;
		setState((state) => {
			if (state.option.scrollMode.enabled) {
				turnPage(dir, state);
				return;
			}
			const oldIndex = state.activePageIndex;
			if (!turnPage(dir, state)) {
				state.isTurnAnimating = false;
				state.isDragMode = false;
				resetPage(state, true);
				state.page.offset.x.px = 0;
				state.page.offset.y.px = 0;
				return;
			}
			success = true;
			const oldRenderRange = state.renderRange;
			const oldOffset = {
				x: {
					pct: state.page.offset.x.pct,
					px: state.page.offset.x.px
				},
				y: {
					pct: state.page.offset.y.pct,
					px: state.page.offset.y.px
				}
			};
			resetPage(state);
			const toX = state.page.offset.x.pct;
			const toY = state.page.offset.y.pct;
			const { x: startX, y: startY } = getTurnStartOffsets({
				state,
				oldIndex,
				oldRenderRange,
				oldOffset
			});
			this.from.x = startX;
			this.from.y = startY;
			this.to.x = toX * state.rootSize.width;
			this.to.y = toY * state.rootSize.height;
			this.toPct.x = toX;
			this.toPct.y = toY;
			state.page.offset.x.pct = toX;
			state.page.offset.y.pct = toY;
			state.page.offset.x.px = startX - toX * state.rootSize.width;
			state.page.offset.y.px = startY - toY * state.rootSize.height;
			state.page.anima = "";
			state.isDragMode = false;
			state.isTurnAnimating = true;
		});
		return success;
	};
	finish = () => {
		this.cancel();
		this.token += 1;
		setState((state) => {
			state.isTurnAnimating = false;
			state.isDragMode = false;
			state.page.offset.x.px = 0;
			state.page.offset.y.px = 0;
			if (state.option.zoom.ratio === 100) resetPage(state, false);
			else state.page.anima = "";
		});
	};
	stop = () => {
		this.cancel();
		this.token += 1;
		if (store.isTurnAnimating) setState((state) => {
			state.isTurnAnimating = false;
			state.page.anima = "";
		});
	};
}();
/** 带滑动动画的翻页。连续翻页会先直接走完上一次动画，再从当前目标页开始新动画 */
const turnPageAnimation = (dir, duration) => turnPageAnimator.start(dir, duration);
/** 取消当前正在播放的翻页滑动动画 */
const cancelTurnAnimation = () => turnPageAnimator.stop();
/** 直接走完当前正在播放的翻页滑动动画 */
const finishTurnAnimation = () => store.isTurnAnimating && turnPageAnimator.finish();
//#endregion
//#region src/components/Manga/actions/hotkeyAction.ts
/** 卷轴模式下滚动至指定页数 */
const scrollIntoView = (index, position = "start") => scrollTo(position === "start" ? getPageTop(index) : getPageTop(index + 1) - store.rootSize.height, true);
/** 判断指定页能否被完全显示出来 */
const isFullView = (i) => pageHeightList()[i] < store.rootSize.height;
/** 在卷轴模式下，智能滚动至图片的头尾 */
const scrollViewTurnPage = (offset) => {
	if (!store.option.scrollMode.enabled) return;
	const dir = offset > 0 ? "next" : "prev";
	if (handleEndTurnPage(dir)) return;
	if (!store.option.scrollMode.alignEdge) return scrollBy(offset, true);
	const viewBottom = scrollTop() + store.rootSize.height;
	let viewBottomPage = findTopPage(viewBottom);
	if (helper.approx(getPageTop(viewBottomPage), viewBottom)) viewBottomPage -= 1;
	const viewTop = scrollTop();
	let viewTopPage = findTopPage(viewTop);
	if (helper.approx(getPageTop(viewTopPage + 1), viewTop)) viewTopPage += 1;
	if (dir === "next") {
		const pageBottom = getPageTop(viewBottomPage + 1);
		if (!helper.approx(viewBottom, pageBottom)) {
			if (viewBottomPage === viewTopPage) {
				if (viewBottom + offset <= pageBottom) return scrollBy(offset, true);
				return scrollIntoView(viewBottomPage, "end");
			}
			return scrollIntoView(viewBottomPage, isFullView(viewBottomPage) ? "end" : "start");
		}
		const nextPage = viewBottomPage + 1;
		scrollIntoView(nextPage, isFullView(nextPage) ? "end" : "start");
	} else {
		const pageTop = getPageTop(viewTopPage);
		if (!helper.approx(viewTop, pageTop)) {
			if (viewBottomPage === viewTopPage) {
				if (viewTop + offset >= pageTop) return scrollBy(offset, true);
				return scrollIntoView(viewTopPage, "start");
			}
			return scrollIntoView(viewTopPage, isFullView(viewTopPage) ? "start" : "end");
		}
		const prevPage = viewTopPage - 1;
		scrollIntoView(prevPage, isFullView(prevPage) ? "start" : "end");
	}
};
/** 根据是否开启了 左右翻页键交换 来切换翻页方向 */
const handleSwapPageTurnKey = (nextPage) => {
	return (store.option.swapPageTurnKey ? !nextPage : nextPage) ? "next" : "prev";
};
const handleHotkey = (hotkey, e) => {
	if (store.imgList.length === 0 && hotkey !== "exit") return;
	stopAutoScroll();
	finishTurnAnimation();
	if (isAbreastMode()) switch (hotkey) {
		case "scroll_up": return setAbreastScrollFill(abreastScrollFill() - 40);
		case "scroll_down": return setAbreastScrollFill(abreastScrollFill() + 40);
		case "scroll_left":
			if (e?.repeat) return constantScroll.start(store.option.dir === "rtl" ? -1 : 1);
			return scrollBy(store.option.dir === "rtl" ? -40 : 40);
		case "scroll_right":
			if (e?.repeat) return constantScroll.start(store.option.dir === "rtl" ? 1 : -1);
			return scrollBy(store.option.dir === "rtl" ? 40 : -40);
		case "page_up": return scrollBy(-store.rootSize.width * .8);
		case "page_down": return scrollBy(store.rootSize.width * .8);
		case "jump_to_home": return scrollTo(0);
		case "jump_to_end": return scrollTo(scrollLength());
	}
	if (isScrollMode()) switch (hotkey) {
		case "page_up": return scrollViewTurnPage(-store.rootSize.height * .8);
		case "page_down": return scrollViewTurnPage(store.rootSize.height * .8);
		case "scroll_up":
			if (e?.repeat) return constantScroll.start(-1);
			return scrollBy(-40, true);
		case "scroll_down":
			if (e?.repeat) return constantScroll.start(1);
			return scrollBy(40, true);
	}
	switch (hotkey) {
		case "page_up":
		case "scroll_up": return turnPageAnimation("prev");
		case "page_down":
		case "scroll_down": return turnPageAnimation("next");
		case "scroll_left": return turnPageAnimation(handleSwapPageTurnKey(store.option.dir === "rtl"));
		case "scroll_right": return turnPageAnimation(handleSwapPageTurnKey(store.option.dir !== "rtl"));
		case "jump_to_home": return setState("activePageIndex", 0);
		case "jump_to_end": return setState("activePageIndex", Math.max(0, store.pageList.length - 1));
		case "jump_to_page":
			jumpToPage();
			return;
		case "switch_page_fill": return switchFillEffect();
		case "switch_scroll_mode": return switchScrollMode();
		case "switch_single_double_page_mode": return switchOnePageMode();
		case "switch_dir": return switchDir();
		case "translate_current_page": return translateCurrent();
		case "translate_all": return translateAll();
		case "translate_to_end": return translateToEnd();
		case "auto_scroll": return switchAutoScroll();
		case "fullscreen": return switchFullscreen();
		case "jump_next": return store.prop.onNext?.();
		case "jump_prev": return store.prop.onPrev?.();
		case "switch_auto_enlarge": return setOption("disableZoom", !store.option.disableZoom);
		case "reload_current_error_img":
			for (const i of showImgList()) reloadImg(getImg(i).src);
			return;
		case "exit": return store.prop.onExit?.();
		default:
			document.body.dispatchEvent(new KeyboardEvent("keydown", e));
			document.body.dispatchEvent(new KeyboardEvent("keyup", e));
	}
};
//#endregion
//#region src/components/Manga/actions/hotkeys.ts
const [defaultHotkeys, setDefaultHotkeys] = solid_js.createSignal({
	scroll_up: ["w", "ArrowUp"],
	scroll_down: ["s", "ArrowDown"],
	scroll_left: [
		"a",
		"Shift + a",
		",",
		"ArrowLeft"
	],
	scroll_right: [
		"d",
		"Shift + d",
		".",
		"ArrowRight"
	],
	page_up: ["PageUp", "Shift + w"],
	page_down: [
		" ",
		"PageDown",
		"Shift + s"
	],
	jump_to_home: ["Home"],
	jump_to_end: ["End"],
	jump_to_page: ["g"],
	exit: ["Escape"],
	switch_page_fill: [
		"/",
		"m",
		"z"
	],
	switch_scroll_mode: [],
	switch_single_double_page_mode: [],
	switch_dir: [],
	switch_auto_enlarge: [],
	translate_current_page: [],
	translate_all: [],
	translate_to_end: [],
	fullscreen: [],
	auto_scroll: [],
	jump_next: [],
	jump_prev: [],
	reload_current_error_img: ["r"]
});
/** 快捷键配置 */
const hotkeysMap = helper.createRootMemo(() => Object.fromEntries(Object.entries(store.hotkeys).flatMap(([name, key]) => key.map((k) => [k, name]))));
const actionsMap = {
	bubble: null,
	capture: null
};
const createKeydownHandler = (type) => (e) => {
	const actions = actionsMap[type];
	if (!actions) return;
	switch (e.target.tagName) {
		case "INPUT":
		case "TEXTAREA": return;
	}
	if (e.target.isContentEditable) return;
	if (Reflect.has(actions, e.key)) {
		if (actions[e.key](e) === "SKIP") return;
		e.stopPropagation();
		e.preventDefault();
		e.stopImmediatePropagation();
		return;
	}
	const hotkeyName = hotkeysMap()[helper.getKeyboardCode(e)];
	if (Reflect.has(actions, hotkeyName)) {
		if (actions[hotkeyName](e) === "SKIP") return;
		e.stopPropagation();
		e.preventDefault();
		e.stopImmediatePropagation();
	}
};
const handlers = {
	bubble: createKeydownHandler("bubble"),
	capture: createKeydownHandler("capture")
};
/** 监听快捷键 */
const listenHotkey = (actions, capture) => {
	const type = capture ? "capture" : "bubble";
	if (actionsMap[type]) Object.assign(actionsMap[type], actions);
	else {
		actionsMap[type] = { ...actions };
		window.addEventListener("keydown", handlers[type], { capture });
	}
	return () => {
		window.removeEventListener("keydown", handlers[type], { capture });
		actionsMap[type] = null;
	};
};
//#endregion
//#region src/components/Manga/actions/imageUpscale.ts
const upscaleImage = async (url, imgEle) => {
	setState("imgMap", url, "upscaleUrl", "");
	const { data, width, height } = helper.getImageData(imgEle);
	initWorker();
	await worker_ImageUpscale.default.upscaleImage(comlink.default.transfer(data, [data.buffer]), width, height, url);
};
let upscaleing = false;
const findUpscaleImage = async (start, end) => {
	for (let i = start; i < end; i++) {
		const img = typeof i === "number" ? getImg(i) : i;
		if (img.upscaleUrl !== void 0) continue;
		const imgEle = await helper.wait(() => getImgEle(img.src, true), 1e3);
		if (imgEle) return [img.src, imgEle];
	}
};
const handleUpscaleImage = async () => {
	if (upscaleing || !isUpscale() || store.imgList.length === 0) return;
	const targetImg = await findUpscaleImage(activeImgIndex(), store.imgList.length) ?? await findUpscaleImage(0, activeImgIndex());
	if (!targetImg) return;
	upscaleing = true;
	await upscaleImage(...targetImg);
	upscaleing = false;
	return handleUpscaleImage();
};
helper.createEffectOn([isUpscale, imgList], handleUpscaleImage);
const bufferToBase64 = (buffer) => {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) binary += String.fromCodePoint(bytes[i]);
	return window.btoa(binary);
};
const getModel = async () => {
	try {
		let base64;
		let buffer;
		if (typeof GM !== "undefined") base64 = await GM.getValue("@model.bin");
		if (!base64) {
			components_Toast.toast(helper.t("upscale.module_downloading"), {
				id: "upscale",
				duration: Infinity
			});
			const bin = await request.request("https://cdn.jsdelivr.net/npm/@hymbz/comic-read-script@11.12.1/public/realcugan/2x-conservative-128/group1-shard1of1.bin", {
				responseType: "arraybuffer",
				noTip: true
			});
			components_Toast.toast(helper.t("upscale.module_download_complete"), {
				id: "upscale",
				duration: 3e3
			});
			buffer = bin.response;
			base64 = bufferToBase64(buffer);
			await GM.setValue("@model.bin", base64);
		}
		const json = await helper.ensureGmValue("@model.json", async () => {
			return (await request.request("https://cdn.jsdelivr.net/npm/@hymbz/comic-read-script@11.12.1/public/realcugan/2x-conservative-128/model.json", { noTip: true })).responseText;
		});
		return {
			base64,
			json,
			buffer
		};
	} catch (error) {
		helper.log.error("获取图片放大模型出错", error);
		components_Toast.toast.dismiss("upscale");
		components_Toast.toast.error(helper.t("upscale.module_download_failed"), {
			id: "upscale",
			duration: Infinity
		});
		setState("supportUpscaleImage", false);
		setState("option", "imgRecognition", "upscale", false);
		throw error;
	}
};
const initWorker = helper.once(() => {
	const mainFn = {
		log: helper.log,
		toast: components_Toast.toast,
		t: helper.t,
		setImg: (url, key, val) => Reflect.has(store.imgMap, url) && setState("imgMap", url, key, val),
		getModel
	};
	worker_ImageUpscale.default.setMainFn(comlink.default.proxy(mainFn), Object.keys(mainFn));
});
//#endregion
//#region src/components/Manga/actions/operate.ts
const handleMouseDown = (e) => {
	if (e.button !== 1 || store.option.scrollMode.enabled) return;
	e.stopPropagation();
	e.preventDefault();
	switchFillEffect();
};
const handleKeyDown = (e) => {
	switch (e.target.tagName) {
		case "INPUT":
		case "TEXTAREA": return;
	}
	if (e.target.className === classes$2.hotkeysItem) return;
	stopAutoScroll();
	finishTurnAnimation();
	const code = helper.getKeyboardCode(e);
	if (e.key === "Escape") {
		if (store.show.pageTip || store.show.scrollbar || store.show.toolbar) {
			e.stopPropagation();
			e.preventDefault();
			return setState((state) => {
				state.show.pageTip = false;
				state.show.scrollbar = false;
				state.show.toolbar = false;
			});
		}
		if (store.show.endPage) {
			e.stopPropagation();
			e.preventDefault();
			return setState("show", "endPage", void 0);
		}
	}
	if (store.imgList.length === 0) return;
	if (e.target.dataset.onlyNumber !== void 0) {
		if (/^(?:Shift \+ )?[a-zA-Z]$/u.test(code)) {
			e.stopPropagation();
			e.preventDefault();
		}
		return;
	}
	if (isScrollMode() && !store.show.endPage) switch (e.key) {
		case "Home":
		case "End":
		case "ArrowRight":
		case "ArrowLeft": return e.stopPropagation();
		case "ArrowUp":
		case "PageUp":
			e.stopPropagation();
			return handleEndTurnPage("prev");
		case "ArrowDown":
		case "PageDown":
		case " ":
			e.stopPropagation();
			return handleEndTurnPage("next");
	}
	if (Reflect.has(hotkeysMap(), code)) {
		e.stopPropagation();
		e.preventDefault();
	} else return;
	handleHotkey(hotkeysMap()[code], e);
};
const handleKeyUp = (e) => {
	switch (hotkeysMap()[helper.getKeyboardCode(e)]) {
		case "scroll_left":
		case "scroll_right":
		case "scroll_up":
		case "scroll_down": return constantScroll.cancel();
	}
};
//#endregion
//#region src/components/Manga/hooks/useDoubleClick.ts
let clickTimeout = null;
const useDoubleClick = (click, doubleClick, timeout = 200) => (event) => {
	if (clickTimeout) {
		clearTimeout(clickTimeout);
		clickTimeout = null;
		doubleClick?.(event);
		return;
	}
	clickTimeout = window.setTimeout(() => {
		click(event);
		clickTimeout = null;
	}, timeout);
};
//#endregion
//#region src/components/Manga/actions/pointer.ts
/** 根据坐标找出被点击到的元素 */
const findClickEle = (eleList, { x, y }) => {
	for (const e of eleList) {
		const rect = e.getBoundingClientRect();
		if (helper.inRange(rect.left, x, rect.right) && helper.inRange(rect.top, y, rect.bottom)) return e;
	}
};
/** 触发点击区域操作 */
const handlePageClick = (e) => {
	for (const i of showImgList()) {
		const img = getImg(i);
		if (img.loadType !== "error") continue;
		const imgEle = getImgEle(img.src);
		if (!imgEle || !findClickEle([imgEle], e)) continue;
		return reloadImg(img.src);
	}
	const targetArea = findClickEle(refs.touchArea.children, e);
	if (!targetArea || getComputedStyle(targetArea).visibility === "hidden") return;
	const areaName = targetArea.dataset.area;
	if (!areaName) return;
	if (areaName === "menu" || areaName === "MENU") return setState((state) => {
		state.show.scrollbar = !state.show.scrollbar;
		state.show.toolbar = !state.show.toolbar;
		state.show.pageTip = !state.show.pageTip;
	});
	setState((state) => {
		resetUI(state);
		switch (areaName) {
			case "NEXT":
			case "next": return handleHotkey("page_down");
			case "PREV":
			case "prev": return handleHotkey("page_up");
		}
	});
};
/** 双击放大 */
const doubleClickZoom = (e) => zoom(store.option.zoom.ratio === 100 ? 350 : 100, e, true);
const normalReaderClick = useDoubleClick(handlePageClick, doubleClickZoom);
const handleClick = (e) => {
	if (!store.autoScroll.play) return normalReaderClick(e);
	// A tap reveals/hides controls without turning a page or stopping playback.
	if (clickTimeout) {
		clearTimeout(clickTimeout);
		clickTimeout = null;
	}
	setState((state) => {
		const show = !state.show.toolbar;
		resetUI(state);
		state.show.toolbar = show;
	});
};
/** 拖动页面的动画控制器 */
const dragAnim = new class extends helper.AnimationFrame {
	dx = 0;
	dy = 0;
	frame = () => {
		if (this.dx === store.page.offset.x.px && this.dy === store.page.offset.y.px) return this.cancel();
		setState((state) => {
			if (state.page.vertical) state.page.offset.y.px = this.dy;
			else state.page.offset.x.px = this.dx;
		});
		this.call(true);
	};
}();
/** 是否从翻页动画的当前偏移直接进入拖拽 */
let dragFromCurrentOffset = false;
const handleDragEnd = (startTime) => {
	dragAnim.dx = 0;
	dragAnim.dy = 0;
	dragAnim.cancel();
	const dir = store.page.vertical ? getTurnPageDir(-store.page.offset.y.px, store.rootSize.height, startTime) : getTurnPageDir(store.page.offset.x.px, store.rootSize.width, startTime);
	if (dir) return turnPageAnimation(dir, 100);
	setState((state) => {
		state.page.offset.x.px = 0;
		state.page.offset.y.px = 0;
		state.page.anima = "page";
		state.isDragMode = false;
	});
};
handleDragEnd.debounce = helper.debounce(handleDragEnd, 200);
const handleMangaFlowDrag = ({ type, xy: [x, y], initial: [ix, iy], startTime }) => {
	switch (type) {
		case "down":
			dragFromCurrentOffset = false;
			if (store.isTurnAnimating) {
				cancelTurnAnimation();
				dragFromCurrentOffset = true;
			}
			return;
		case "move": {
			dragAnim.dx = store.option.dir === "rtl" ? x - ix : ix - x;
			dragAnim.dy = y - iy;
			if (store.isDragMode) return dragAnim.call();
			let slideDir;
			const dxAbs = Math.abs(dragAnim.dx);
			const dyAbs = Math.abs(dragAnim.dy);
			if (dxAbs > 5 && dyAbs < 5) slideDir = "horizontal";
			if (dyAbs > 5 && dxAbs < 5) slideDir = "vertical";
			if (!slideDir) return;
			if (dragFromCurrentOffset) {
				dragFromCurrentOffset = false;
				setState("isDragMode", true);
			} else {
				cancelTurnAnimation();
				setState((state) => {
					state.page.vertical = slideDir === "vertical";
					state.isDragMode = true;
					resetPage(state);
				});
			}
			return;
		}
		case "up":
		case "cancel":
			dragFromCurrentOffset = false;
			return handleDragEnd(startTime);
	}
};
//#endregion
//#region src/components/Manga/actions/scrollMode.ts
/** 修改卷轴模式下图片的目标宽度 */
const setAdjustToWidth = (val) => {
	if (typeof store.option.scrollMode.adjustToWidth !== "number") return;
	if (typeof val === "function") val = val(store.option.scrollMode.adjustToWidth);
	if (Number.isNaN(val)) return;
	const jump = saveScrollProgress();
	const newVal = helper.clamp(200, val, Math.ceil(store.rootSize.width));
	setOption("scrollMode", "adjustToWidth", newVal);
	jump();
};
const minImgWidth = helper.createRootMemo(() => {
	let min = Infinity;
	for (const img of Object.values(store.imgMap)) if (img.width && img.width < min) min = img.width;
	return min;
});
/** 在卷轴模式下进行缩放，并且保持滚动进度不变 */
const setImgScale = (val) => {
	if (typeof val === "function") val = val(store.option.scrollMode.imgScale);
	if (Number.isNaN(val)) return;
	const jump = saveScrollProgress();
	let newVal = helper.clamp(.1, val, 3);
	if (minImgWidth() > store.rootSize.width && newVal < store.option.scrollMode.imgScale) {
		const maxImgScale = store.rootSize.width / minImgWidth();
		if (newVal > maxImgScale) newVal = maxImgScale;
	}
	newVal = Number(newVal.toFixed(2));
	setOption("scrollMode", "imgScale", helper.clamp(.1, newVal, 3));
	jump();
};
/** 处理卷轴模式下的放大/缩小操作 */
const handleScrollModeZoom = (dir) => {
	if (!store.option.scrollMode.enabled) return;
	if (store.option.scrollMode.adjustToWidth === "full") return;
	if (store.option.scrollMode.adjustToWidth === "disable" || isAbreastMode()) setImgScale((val) => val + .05 * (dir === "add" ? 1 : -1));
	else setAdjustToWidth((val) => val + 100 * (dir === "add" ? 1 : -1));
};
//#endregion
//#region src/components/Manga/actions/scrollModeDrag.ts
/** 摩擦系数 */
const FRICTION_COEFF = .96;
const calcVelocityAnim = new class extends helper.AnimationFrame {
	lastTop = 0;
	dy = 0;
	lastLeft = 0;
	dx = 0;
	frame = () => {
		const nowTop = store.option.scrollMode.abreastMode ? abreastScrollFill() : scrollTop();
		this.dy = nowTop - this.lastTop;
		this.lastTop = nowTop;
		this.dx = store.page.offset.x.px - this.lastLeft;
		this.lastLeft = store.page.offset.x.px;
		this.call(true);
	};
}();
const slideAnim = new class extends helper.AnimationFrame {
	lastTime = 0;
	frame = (timestamp) => {
		if (Math.abs(calcVelocityAnim.dx) + Math.abs(calcVelocityAnim.dy) < 1) {
			this.animationId = 0;
			return;
		}
		if (timestamp - this.lastTime > 16) {
			calcVelocityAnim.dy *= FRICTION_COEFF;
			calcVelocityAnim.dx *= FRICTION_COEFF;
			this.lastTime = timestamp;
		}
		if (store.option.scrollMode.abreastMode) {
			scrollTo(scrollTop() + calcVelocityAnim.dx);
			setAbreastScrollFill(abreastScrollFill() + calcVelocityAnim.dy);
		} else scrollTo(scrollTop() + calcVelocityAnim.dy);
		this.call(true);
	};
}();
let initTop = 0;
let initLeft = 0;
let initAbreastScrollFill = 0;
const handleScrollModeDrag = ({ type, xy: [x, y], initial: [ix, iy], startTime }, e) => {
	if (!store.option.scrollMode.abreastMode && e.pointerType !== "mouse") return;
	switch (type) {
		case "down":
			calcVelocityAnim.cancel();
			slideAnim.cancel();
			initTop = refs.mangaBox.scrollTop;
			initLeft = store.page.offset.x.px * (store.option.dir === "rtl" ? 1 : -1);
			initAbreastScrollFill = abreastScrollFill();
			calcVelocityAnim.call();
			return;
		case "move":
			if (store.option.scrollMode.abreastMode) {
				const _dx = x - ix;
				const _dy = y - iy;
				scrollTo((initLeft + _dx) * (store.option.dir === "rtl" ? 1 : -1));
				setAbreastScrollFill(initAbreastScrollFill + _dy);
			} else scrollTo(initTop + iy - y);
			return;
		case "up":
			calcVelocityAnim.cancel();
			if (performance.now() - startTime < 50) return;
			slideAnim.call();
	}
};
//#endregion
//#region src/components/Manga/actions/scrollbar.ts
/** 判断点击位置在滚动条上的位置比率 */
const getClickTop = (x, y, e) => {
	switch (scrollPosition()) {
		case "bottom":
		case "top": return store.option.dir === "rtl" ? 1 - x / e.offsetWidth : x / e.offsetWidth;
		default: return y / e.offsetHeight;
	}
};
/** 计算在滚动条上的拖动距离 */
const getSliderDist = ([x, y], [ix, iy], e) => {
	switch (scrollPosition()) {
		case "bottom":
		case "top": return store.option.dir === "rtl" ? (1 - (x - ix)) / e.offsetWidth : (x - ix) / e.offsetWidth;
		default: return (y - iy) / e.offsetHeight;
	}
};
const [isDrag, setIsDrag] = solid_js.createSignal(false);
const closeDrag = helper.debounce(() => setIsDrag(false), 200);
let lastType = "up";
/** 开始拖拽时的 sliderTop 值 */
let startTop = 0;
const handleScrollbarSlider = ({ type, xy, initial }, e) => {
	stopAutoScroll();
	finishTurnAnimation();
	const [x, y] = xy;
	if (type === "move" && lastType === type) {
		setIsDrag(true);
		closeDrag();
	}
	lastType = type;
	if (type === "up") return;
	if (!refs.mangaFlow) return;
	const scrollbarDom = e.target;
	/** 点击位置在滚动条上的位置比率 */
	const clickTop = getClickTop(x, y, e.target);
	if (store.option.scrollMode.enabled) {
		if (type === "move") {
			const top = helper.clamp(0, startTop + getSliderDist(xy, initial, scrollbarDom), 1) * scrollLength();
			scrollTo(top);
		} else {
			startTop = clickTop - sliderHeight() / 2;
			const top = startTop * scrollLength();
			scrollTo(top, true);
		}
	} else {
		let newPageIndex = Math.floor(clickTop * store.pageList.length);
		if (newPageIndex < 0) newPageIndex = 0;
		else if (newPageIndex >= store.pageList.length) newPageIndex = store.pageList.length - 1;
		if (newPageIndex !== store.activePageIndex) setState("activePageIndex", newPageIndex);
	}
};
//#endregion
//#region src/components/Manga/actions/show.ts
/** 获取指定图片的提示文本 */
const getImgTip = (i) => {
	if (i === -1) return helper.t("other.fill_page");
	const img = getImg(i);
	if (img.loadType !== "loaded") return `${i + 1} (${helper.t(`img_status.${img.loadType}`)})`;
	if (img.translationType && img.translationType !== "hide" && img.translationMessage) return `${i + 1}：${img.translationMessage}`;
	if (isUpscale() && img.upscaleUrl !== void 0) return `${i + 1} (${img.upscaleUrl ? helper.t("upscale.upscaled") : helper.t("upscale.upscaling")})`;
	return `${i + 1}`;
};
/** 获取指定页面的提示文本 */
const getPageTip = (pageIndex) => {
	const page = store.pageList[pageIndex];
	if (!page) return "null";
	const pageIndexText = page.map((index) => index === -1 ? helper.t("other.fill_page") : `${index + 1}`);
	if (pageIndexText.length === 1) return pageIndexText[0];
	if (store.option.dir === "rtl") pageIndexText.reverse();
	return pageIndexText.join(" | ");
};
helper.createEffectOn(() => store.activePageIndex, () => store.show.endPage && setState("show", "endPage", void 0), { defer: true });
helper.createEffectOn(activePage, helper.throttle(() => store.isDragMode || store.isTurnAnimating || setState(resetPage)));
helper.createEffectOn(() => store.show.toolbar, () => {
	if (store.show.toolbar) return;
	setState((state) => {
		state.show.scrollbar = false;
		state.show.pageTip = false;
	});
}, { defer: true });
//#endregion
//#region src/components/Manga/actions/wheel/scrollDevice.ts
/** 判断两个数值是否成整数倍 */
const isMultipleOf = (a, b) => (a < b ? b % a : a % b) === 0;
/** C 类设备下连续出现成倍滚动量的次数，达到阈值才允许切换为 A/B 类 */
let consecutiveMultiple = 0;
let lastDelta = Infinity;
/** 根据传入的滚动事件判定滚动设备类型 */
const detectScrollDevice = (e) => {
	const absDelta = Math.max(Math.abs(e.deltaX), Math.abs(e.deltaY));
	let type;
	if (e.deltaMode !== 0) type = "a";
	else if (e.phase !== void 0) type = "c";
	else if (absDelta < 10 || lastDelta < 10) type = "c";
	else if (lastDelta === Infinity) type = void 0;
	else if (isMultipleOf(lastDelta, absDelta)) {
		if (store.scrollDeviceType === "c" && ++consecutiveMultiple < 3) type = void 0;
		else {
			consecutiveMultiple = 0;
			type = Math.max(lastDelta, absDelta) >= 40 ? "a" : "b";
		}
	} else type = "c";
	if (type === "c") consecutiveMultiple = 0;
	lastDelta = absDelta;
	if (type) setState("scrollDeviceType", type);
};
//#endregion
//#region src/components/Manga/actions/wheel/wheelRatchet.ts
/** 虚拟棘轮步长 */
const wheelStepLength = helper.createRootMemo(() => {
	switch (store.scrollDeviceType) {
		case "a":
		case "b": return 120;
		case "c": return 360;
		case void 0: return Infinity;
	}
});
const wheelRatchet = new class {
	/** 带方向的累计滚动量，正数表示向下滚动 */
	wheelDy = 0;
	/** 按当前步长处理累计滚动量进行翻页 */
	processWheel = (state) => {
		const step = wheelStepLength();
		while (this.wheelDy <= -step) {
			if (!turnPage("next", state)) {
				this.wheelDy = -step;
				break;
			}
			this.wheelDy += step;
		}
		while (this.wheelDy >= step) {
			if (!turnPage("prev", state)) {
				this.wheelDy = step;
				break;
			}
			this.wheelDy -= step;
		}
		state.wheelProgress = -this.wheelDy / step;
		resetPage(state);
	};
	processWheelThrottled = helper.throttle(() => setState(this.processWheel), 16);
	/** 停止滚动一段时间后重置状态 */
	handleWheelEnd = helper.debounce(() => {
		this.wheelDy = 0;
		setState("wheelProgress", 0);
	}, 300);
	/** 处理滚动产生的连续位移，通过虚拟棘轮（累计满一个步长）实现翻页 */
	handleContinuousWheel(delta) {
		if (store.option.scrollMode.enabled) return;
		openScrollLock();
		this.wheelDy += Math.floor(delta);
		this.processWheelThrottled();
		this.handleWheelEnd();
	}
}();
//#endregion
//#region src/components/Manga/actions/wheel/index.ts
let firstWheelTimer = 0;
/** 获取滚轮事件的主轴向与主轴向滚动量 */
const getWheelAxis = (e) => {
	const absDeltaX = Math.abs(e.deltaX);
	const absDeltaY = Math.abs(e.deltaY);
	const horizontal = absDeltaX > absDeltaY;
	return {
		horizontal,
		delta: horizontal ? e.deltaX : e.deltaY,
		absDelta: horizontal ? absDeltaX : absDeltaY
	};
};
/** 根据主轴向与漫画方向计算翻页方向 */
const getWheelDir = (horizontal, delta) => {
	if (horizontal) {
		if (store.option.dir === "rtl") return delta < 0 ? "next" : "prev";
		return delta > 0 ? "next" : "prev";
	}
	return delta > 0 ? "next" : "prev";
};
/** A 类设备直接翻页，不经过虚拟棘轮 */
const turnPageByWheel = (dir) => {
	wheelRatchet.wheelDy = 0;
	openScrollLock();
	turnPageAnimation(dir);
};
const handleWheel = (e) => {
	stopAutoScroll();
	finishTurnAnimation();
	e.stopPropagation();
	if (e.ctrlKey || e.altKey) e.preventDefault();
	const { horizontal, delta, absDelta } = getWheelAxis(e);
	const isPositiveDelta = delta > 0;
	const dir = getWheelDir(horizontal, delta);
	if (absDelta === 0) return;
	if (isScrollMode() && horizontal) return;
	if ((e.ctrlKey || e.altKey) && store.option.scrollMode.enabled && store.option.zoom.ratio === 100) {
		e.preventDefault();
		return handleScrollModeZoom(isPositiveDelta ? "sub" : "add");
	}
	if (e.ctrlKey || e.altKey) {
		e.preventDefault();
		return zoom(store.option.zoom.ratio + (isPositiveDelta ? -25 : 25), e);
	}
	if (store.page.vertical === horizontal) setState((state) => {
		state.page.vertical = !horizontal;
		resetPage(state);
	});
	if (!isScrollMode()) e.preventDefault();
	detectScrollDevice(e);
	if (store.scrollDeviceType === void 0) firstWheelTimer = window.setTimeout(() => {
		setState("scrollDeviceType", "a");
		turnPageByWheel(dir);
	}, 100);
	else if (firstWheelTimer) {
		clearTimeout(firstWheelTimer);
		firstWheelTimer = 0;
	}
	if (absDelta >= 5 && handleEndTurnPage(dir)) {
		openScrollLock();
		return e.preventDefault();
	}
	if (isAbreastMode() && store.option.zoom.ratio === 100) {
		e.preventDefault();
		scrollBy(delta, true);
	}
	if (store.option.scrollMode.enabled) return;
	if (store.scrollDeviceType === "a") return turnPageByWheel(dir);
	return wheelRatchet.handleContinuousWheel(dir === "next" ? -absDelta : absDelta);
};
//#endregion
//#region src/components/Manga/hooks/useEventListener.ts
const useEventListener = (ref) => {
	const listeners = /* @__PURE__ */ new Map();
	solid_js.createEffect(() => {
		const el = ref();
		if (!el) return;
		for (const [type, list] of listeners) for (const { listener, options } of list) el.addEventListener(type, listener, options);
		solid_js.onCleanup(() => {
			for (const [type, list] of listeners) for (const { listener, options } of list) el.removeEventListener(type, listener, options);
		});
	});
	return (type, listener, options) => {
		const list = listeners.get(type) ?? [];
		list.push({
			listener,
			options
		});
		listeners.set(type, list);
	};
};
//#endregion
//#region src/components/Manga/hooks/useHiddenMouse.ts
/** 在鼠标静止一段时间后自动隐藏 */
const useHiddenMouse = (ref) => {
	const [hiddenMouse, setHiddenMouse] = solid_js.createSignal(true);
	const on = useEventListener(ref);
	const hidden = helper.debounce(() => setHiddenMouse(true), 1e3);
	on("mousemove", () => {
		setHiddenMouse(false);
		hidden();
	});
	on("mouseleave", () => {
		hidden.clear();
		setHiddenMouse(false);
	});
	return hiddenMouse;
};
//#endregion
//#region src/components/Manga/hooks/useStyle.ts
function css$1(arg1, arg2, ...rest) {
	solid_js.onMount(() => {
		if (typeof arg1 !== "object" || !("raw" in arg1)) {
			if (arg2 === void 0) helper.css(arg1, refs.root);
			else helper.css(arg1, arg2, refs.root);
		} else helper.css(["", ...arg1], refs.root, ...rest);
	});
}
//#endregion
//#region src/components/Manga/components/ComicImg.tsx
var _tmpl$$37 = /*#__PURE__*/ solid_js_web.template(`<img draggable=false decoding=async>`);
var _tmpl$2$8 = /*#__PURE__*/ solid_js_web.template(`<div><picture><div>`);
const ComicImg = (img) => {
	const showState = () => store.imgShowState[img.index];
	solid_js.createEffect(() => src() && getImgEle(img.src)?.decode());
	const src = () => {
		if (img.loadType === "wait") return "";
		if (img.translationType === "show") return img.translationUrl;
		if (store.option.imgRecognition.enabled) {
			if (store.option.imgRecognition.upscale && img.upscaleUrl) return img.upscaleUrl;
			return img.blobUrl;
		}
		if (img.src.startsWith("blob:")) return img.src.replace(/#\..+/u, "");
		return img.src;
	};
	/** 并排卷轴模式下图片在各列中的位置 */
	const abreastPosition = solid_js.createMemo(() => isAbreastMode() ? abreastArea().position[img.index] : void 0);
	/** 并排卷轴模式下需要复制的图片数量 */
	const cloneNum = solid_js.createMemo(() => {
		const positions = abreastPosition();
		return positions ? positions.length - 1 : 0;
	});
	/** 打开「边缘裁切」后使用的样式 */
	const cropStyle = solid_js.createMemo(() => {
		const crop = getCropMargin(img);
		if (!crop) return null;
		const cw = 1 - crop.left - crop.right;
		const ch = 1 - crop.top - crop.bottom;
		const picture = { overflow: "clip" };
		const isDisableZoomNonScroll = store.option.disableZoom && !store.option.scrollMode.enabled;
		if (isDisableZoomNonScroll || isAbreastMode()) {
			if (isDisableZoomNonScroll) {
				const pageIndex = imgPageMap()[img.index];
				const isFullWidth = (pageIndex === void 0 ? void 0 : store.pageList[pageIndex])?.length === 1;
				const scale = Math.min(1, store.rootSize.width * (isFullWidth ? 1 : .5) / img.size.width, store.rootSize.height / img.size.height) || 1;
				picture.width = `${img.size.width * scale}px`;
				picture.height = `${img.size.height * scale}px`;
			} else {
				picture.width = `${img.size.width}px`;
				picture.height = `${img.size.height}px`;
			}
		}
		return {
			imgEle: {
				position: "absolute",
				left: `${-crop.left / cw * 100}%`,
				top: `${-crop.top / ch * 100}%`,
				width: `${1 / cw * 100}%`,
				height: `${1 / ch * 100}%`,
				"max-width": "none",
				"max-height": "none",
				"object-fit": "fill"
			},
			picture
		};
	});
	const styles = solid_js.createMemo(() => ({
		img: {
			"grid-area": isAbreastMode() ? "none" : `_${img.index}`,
			"background-color": isEnableBg() ? img.background ?? void 0 : void 0
		},
		imgEle: cropStyle()?.imgEle,
		picture: {
			"aspect-ratio": `${img.size.width} / ${img.size.height}`,
			background: img.progress ? `linear-gradient(
              to bottom,
              var(--secondary-bg) ${img.progress}%,
              var(--hover-bg-color,#fff3) ${img.progress}%
            )` : void 0,
			...cropStyle()?.picture
		}
	}));
	const ComicImgBase = (props) => {
		const imgStyle = solid_js.createMemo(() => {
			const position = abreastPosition()?.[props.cloneIndex ?? 0];
			if (!position) return styles().img;
			return {
				...styles().img,
				"grid-area": `_${position.column}`,
				transform: `translateY(${position.top}px)`
			};
		});
		return (() => {
			var _el$ = _tmpl$2$8(), _el$2 = _el$.firstChild, _el$4 = _el$2.firstChild;
			solid_js_web.insert(_el$2, solid_js_web.createComponent(solid_js.Show, {
				get when() {
					return src();
				},
				get children() {
					var _el$3 = _tmpl$$37();
					_el$3.addEventListener("error", (e) => handleImgError(img.src, e.currentTarget));
					_el$3.addEventListener("load", (e) => handleImgLoaded(img.src, e.currentTarget));
					solid_js_web.use((el) => {
						refs.imgEleMap[img.src] ??= /* @__PURE__ */ new Set();
						const set = refs.imgEleMap[img.src];
						set.add(el);
						solid_js.onCleanup(() => {
							set.delete(el);
							if (set.size === 0) delete refs.imgEleMap[img.src];
						});
					}, _el$3);
					solid_js_web.effect((_p$) => {
						var _v$ = styles().imgEle, _v$2 = src(), _v$3 = `${img.index}`, _v$4 = img.src;
						_p$.e = solid_js_web.style(_el$3, _v$, _p$.e);
						_v$2 !== _p$.t && solid_js_web.setAttribute(_el$3, "src", _p$.t = _v$2);
						_v$3 !== _p$.a && solid_js_web.setAttribute(_el$3, "alt", _p$.a = _v$3);
						_v$4 !== _p$.o && solid_js_web.setAttribute(_el$3, "data-src", _p$.o = _v$4);
						return _p$;
					}, {
						e: void 0,
						t: void 0,
						a: void 0,
						o: void 0
					});
					return _el$3;
				}
			}), _el$4);
			solid_js_web.insert(_el$4, () => getImgTip(img.index));
			solid_js_web.effect((_p$) => {
				var _v$5 = classes$2.img, _v$6 = imgStyle(), _v$7 = showState(), _v$8 = img.type ?? store.defaultImgType, _v$9 = img.loadType === "loaded" ? void 0 : img.loadType, _v$0 = styles().picture, _v$1 = img.src, _v$10 = classes$2.pageTip;
				_v$5 !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$5);
				_p$.t = solid_js_web.style(_el$, _v$6, _p$.t);
				_v$7 !== _p$.a && solid_js_web.setAttribute(_el$, "data-show", _p$.a = _v$7);
				_v$8 !== _p$.o && solid_js_web.setAttribute(_el$, "data-type", _p$.o = _v$8);
				_v$9 !== _p$.i && solid_js_web.setAttribute(_el$, "data-load-type", _p$.i = _v$9);
				_p$.n = solid_js_web.style(_el$2, _v$0, _p$.n);
				_v$1 !== _p$.s && solid_js_web.setAttribute(_el$2, "data-src", _p$.s = _v$1);
				_v$10 !== _p$.h && solid_js_web.className(_el$4, _p$.h = _v$10);
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
	};
	return [solid_js_web.createComponent(ComicImgBase, {}), solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return cloneNum() > 0;
		},
		get children() {
			return solid_js_web.createComponent(solid_js.For, {
				get each() {
					return Array.from({ length: cloneNum() });
				},
				children: (_, i) => solid_js_web.createComponent(ComicImgBase, { get cloneIndex() {
					return i() + 1;
				} })
			});
		}
	})];
};
//#endregion
//#region src/components/Manga/components/ComicImgFlow.tsx
var _tmpl$$36 = /*#__PURE__*/ solid_js_web.template(`<div tabindex=-1><div tabindex=-1>`);
const ComicImgFlow = () => {
	const hiddenMouse = useHiddenMouse(() => refs.mangaFlow);
	const dispatchReaderDrag = (state, e) => {
		if (touches.size > 1) return handlePinchZoom(state, e);
		if (store.option.zoom.ratio !== 100) return handleZoomDrag(state, e);
		if (store.option.scrollMode.enabled) return handleScrollModeDrag(state, e);
		return handleMangaFlowDrag(state, e);
	};
	const handleDrag = (state, e) => {
		if (store.autoScroll.play) {
			const moved = Math.hypot(state.xy[0] - state.initial[0], state.xy[1] - state.initial[1]) > 8;
			// Pointer down/up alone, including small finger jitter, is a tap, not a pause.
			if (touches.size <= 1 && !moved) return;
			stopAutoScroll();
			// Drag/zoom controllers skipped pointerdown while autoplay owned the viewport.
			dispatchReaderDrag({ ...state, type: "down", xy: state.initial, last: state.initial }, e);
			if (state.type === "down") return;
		}
		return dispatchReaderDrag(state, e);
	};
	solid_js.onMount(() => {
		helper.useDrag({
			ref: refs.mangaBox,
			handleDrag,
			handleClick,
			touches,
			setCapture: true
		});
		bindScrollTop(refs.mangaBox);
	});
	const handleTransitionEnd = () => {
		if (store.isDragMode || store.isTurnAnimating) return;
		setState((state) => {
			if (store.option.zoom.ratio === 100) resetPage(state, false);
			else state.page.anima = "";
		});
	};
	/** 在当前页之前有图片被加载出来，导致内容高度发生变化后，重新滚动页面，确保当前显示位置不变 */
	helper.createEffectOn([
		() => store.showRange[0],
		() => pageTopList()[store.showRange[0]],
		pageTopList
	], ([showImg, height, topList], prev) => {
		if (!prev || !height || !isScrollMode()) return;
		const [prevShowImg, prevHeight, prevTopList] = prev;
		if (showImg !== prevShowImg || prevTopList === topList || prevHeight === height) return;
		scrollTo(scrollTop() + height - prevHeight);
	});
	const pageToText = (page) => (page.length === 1 ? [page[0], page[0]] : page).map((i) => i === -1 ? "." : `_${i}`).join(" ");
	const gridAreas = solid_js.createMemo(() => {
		if (store.pageList.length === 0) return;
		if (store.option.scrollMode.enabled) {
			if (store.option.scrollMode.abreastMode) return `"${helper.range(abreastArea().columns.length, (i) => `_${i}`).join(" ")}"`;
			if (store.option.scrollMode.doubleMode) {
				const { pageColumns } = store.option.scrollMode;
				return scrollPageList().map((row) => {
					const missNum = pageColumns * 2 - row.length * 2;
					return `"${[...row.map(pageToText), ...helper.range(missNum, ".")].join(" ")}"`;
				}).join("\n");
			}
			return helper.range(store.imgList.length, (i) => `"_${i}"`).join("\n");
		}
		return store.page.vertical ? store.pageList.slice(store.renderRange[0], store.renderRange[1] + 1).map((page) => `"${pageToText(page)}"`).join("\n") : `"${store.pageList.slice(store.renderRange[0], store.renderRange[1] + 1).map(pageToText).join(" ")}"`;
	});
	css$1(`.${classes$2.mangaBox}`, { transform: () => `translate(${store.option.zoom.offset.x}px, ${store.option.zoom.offset.y}px)
        scale(${store.option.zoom.ratio / 100})` });
	const pageX = solid_js.createMemo(() => {
		if (isScrollMode()) return 0;
		let x = store.page.offset.x.pct * store.rootSize.width + store.page.offset.x.px;
		if (store.option.dir !== "rtl") x = -x;
		return x;
	});
	css$1(`#${classes$2.mangaFlow}`, {
		left: () => `${pageX()}px`,
		top: () => `${store.page.offset.y.pct * store.rootSize.height + store.page.offset.y.px}px`,
		"touch-action"() {
			if (store.option.zoom.ratio === 100) return;
			if (!store.option.scrollMode.enabled) return "none";
			if (store.option.zoom.offset.y === 0) return "pan-up";
			if (store.option.zoom.offset.y === bound().y) return "pan-down";
		},
		"grid-template-areas": gridAreas,
		"grid-template-columns"() {
			if (store.imgList.length === 0) return;
			if (store.option.scrollMode.enabled) {
				if (store.option.scrollMode.abreastMode) return `repeat(${abreastArea().columns.length}, ${abreastColumnWidth()}px)`;
				if (store.option.scrollMode.doubleMode) return `repeat(${store.option.scrollMode.pageColumns * 2}, 1fr)`;
				return;
			}
			if (store.page.vertical) return "50% 50%";
			return `repeat(${gridAreas()?.split(" ").length ?? 0}, 50%)`;
		},
		"grid-template-rows"() {
			if (isScrollMode()) return pageHeightList().map((num) => `${num}px`).join(" ");
		},
		"background-color": () => isEnableBg() ? getImg(activeImgIndex())?.background ?? void 0 : void 0
	});
	const renderList = solid_js.createMemo(() => {
		const list = new Set(renderImgList());
		for (const url of loadState.loadingUrlSet) {
			const indexList = imgIndexMap().get(url);
			if (!indexList) continue;
			if (indexList.some((index) => list.has(index))) continue;
			list.add(indexList[0]);
		}
		return [...list].toSorted((a, b) => a - b);
	});
	return (() => {
		var _el$ = _tmpl$$36(), _el$2 = _el$.firstChild;
		solid_js_web.addEventListener(_el$, "scrollend", () => { if (!store.autoScroll.play) focus(); });
		_el$.addEventListener("transitionend", handleTransitionEnd);
		var _ref$ = bindRef("mangaBox");
		typeof _ref$ === "function" && solid_js_web.use(_ref$, _el$);
		_el$2.addEventListener("transitionend", handleTransitionEnd);
		var _ref$2 = bindRef("mangaFlow");
		typeof _ref$2 === "function" && solid_js_web.use(_ref$2, _el$2);
		solid_js_web.insert(_el$2, solid_js_web.createComponent(solid_js.For, {
			get each() {
				return renderList();
			},
			children: (i) => solid_js_web.createComponent(ComicImg, solid_js_web.mergeProps({ index: i }, () => store.imgMap[store.imgList[i]]))
		}));
		solid_js_web.effect((_p$) => {
			var _v$ = `${classes$2.mangaBox} ${classes$2.beautifyScrollbar}`, _v$2 = store.page.anima, _v$3 = helper.boolDataVal(store.option.scrollMode.abreastMode), _v$4 = classes$2.mangaFlow, _v$5 = store.option.dir, _v$6 = `${classes$2.mangaFlow} ${classes$2.beautifyScrollbar}`, _v$7 = helper.boolDataVal(store.option.disableZoom && !store.option.scrollMode.enabled), _v$8 = helper.boolDataVal(store.option.zoom.ratio !== 100), _v$9 = helper.boolDataVal(store.page.vertical), _v$0 = store.option.autoHiddenMouse && hiddenMouse();
			_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "data-animation", _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "data-abreast-scroll", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$2, "id", _p$.o = _v$4);
			_v$5 !== _p$.i && solid_js_web.setAttribute(_el$2, "dir", _p$.i = _v$5);
			_v$6 !== _p$.n && solid_js_web.className(_el$2, _p$.n = _v$6);
			_v$7 !== _p$.s && solid_js_web.setAttribute(_el$2, "data-disable-zoom", _p$.s = _v$7);
			_v$8 !== _p$.h && solid_js_web.setAttribute(_el$2, "data-scale-mode", _p$.h = _v$8);
			_v$9 !== _p$.r && solid_js_web.setAttribute(_el$2, "data-vertical", _p$.r = _v$9);
			_v$0 !== _p$.d && solid_js_web.setAttribute(_el$2, "data-hidden-mouse", _p$.d = _v$0);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0,
			i: void 0,
			n: void 0,
			s: void 0,
			h: void 0,
			r: void 0,
			d: void 0
		});
		return _el$;
	})();
};
//#endregion
//#region src/components/Manga/components/TouchArea.tsx
var _tmpl$$35 = /*#__PURE__*/ solid_js_web.template(`<div>`);
var _tmpl$2$7 = /*#__PURE__*/ solid_js_web.template(`<div role=button tabindex=-1>`);
const areaArrayMap = {
	left_right: [
		[
			"prev",
			"menu",
			"next"
		],
		[
			"PREV",
			"MENU",
			"NEXT"
		],
		[
			"prev",
			"menu",
			"next"
		]
	],
	up_down: [
		[
			"prev",
			"PREV",
			"prev"
		],
		[
			"menu",
			"MENU",
			"menu"
		],
		[
			"next",
			"NEXT",
			"next"
		]
	],
	edge: [
		[
			"next",
			"menu",
			"next"
		],
		[
			"NEXT",
			"MENU",
			"NEXT"
		],
		[
			"next",
			"PREV",
			"next"
		]
	],
	l: [
		[
			"PREV",
			"prev",
			"prev"
		],
		[
			"prev",
			"MENU",
			"next"
		],
		[
			"next",
			"next",
			"NEXT"
		]
	]
};
const areaType = helper.createRootMemo(() => Reflect.has(areaArrayMap, store.option.clickPageTurn.area) ? store.option.clickPageTurn.area : "left_right");
const dir = helper.createRootMemo(() => {
	if (!store.option.clickPageTurn.reverse) return store.option.dir;
	return store.option.dir === "rtl" ? "ltr" : "rtl";
});
const TouchArea = () => (() => {
	var _el$ = _tmpl$$35();
	var _ref$ = bindRef("touchArea");
	typeof _ref$ === "function" && solid_js_web.use(_ref$, _el$);
	solid_js_web.insert(_el$, solid_js_web.createComponent(solid_js.For, {
		get each() {
			return areaArrayMap[areaType()];
		},
		children: (rows) => solid_js_web.createComponent(solid_js.For, {
			each: rows,
			children: (area) => (() => {
				var _el$2 = _tmpl$2$7();
				solid_js_web.setAttribute(_el$2, "data-area", area);
				solid_js_web.effect(() => solid_js_web.className(_el$2, classes$2.touchArea));
				return _el$2;
			})()
		})
	}));
	solid_js_web.effect((_p$) => {
		var _v$ = classes$2.touchAreaRoot, _v$2 = dir(), _v$3 = helper.boolDataVal(store.show.touchArea), _v$4 = areaType(), _v$5 = helper.boolDataVal(store.option.clickPageTurn.enabled), _v$6 = helper.boolDataVal(store.option.clickPageTurn.shrinkMenu);
		_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
		_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "dir", _p$.t = _v$2);
		_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "data-show", _p$.a = _v$3);
		_v$4 !== _p$.o && solid_js_web.setAttribute(_el$, "data-area", _p$.o = _v$4);
		_v$5 !== _p$.i && solid_js_web.setAttribute(_el$, "data-turn-page", _p$.i = _v$5);
		_v$6 !== _p$.n && solid_js_web.setAttribute(_el$, "data-shrink-menu", _p$.n = _v$6);
		return _p$;
	}, {
		e: void 0,
		t: void 0,
		a: void 0,
		o: void 0,
		i: void 0,
		n: void 0
	});
	return _el$;
})();
//#endregion
//#region src/components/Manga/components/EndPage.tsx
var _tmpl$$34 = /*#__PURE__*/ solid_js_web.template(`<div>`);
var _tmpl$2$6 = /*#__PURE__*/ solid_js_web.template(`<div role=button tabindex=-1><div><p></p><button type=button></button><button type=button data-is-end></button><button type=button>`);
var _tmpl$3$2 = /*#__PURE__*/ solid_js_web.template(`<p>`);
let delayTypeTimer = 0;
const EndPage = () => {
	const handleClick = (e) => {
		e.stopPropagation();
		if (e.target?.nodeName !== "BUTTON") setState("show", "endPage", void 0);
		focus();
	};
	let ref;
	const [isDrag, setIsDrag] = solid_js.createSignal(false);
	const [dragY, setDragY] = solid_js.createSignal(0);
	const handleDrag = ({ type, xy: [, y], initial: [, iy], startTime }) => {
		switch (type) {
			case "down": return setIsDrag(true);
			case "move": return setDragY(y - iy);
		}
		const pageDir = getTurnPageDir(-dragY(), store.rootSize.height / 2, startTime);
		if (pageDir) handleEndTurnPage(pageDir);
		setDragY(0);
		setIsDrag(false);
	};
	solid_js.onMount(() => {
		helper.useDrag({
			ref,
			handleDrag,
			skip: (e) => e.target.matches(`.${classes$2.comments}, .${classes$2.comments} *`)
		});
	});
	const [delayType, setDelayType] = solid_js.createSignal();
	solid_js.createEffect(() => {
		if (store.show.endPage) {
			window.clearTimeout(delayTypeTimer);
			setDelayType(store.show.endPage);
		} else delayTypeTimer = window.setTimeout(() => setDelayType(store.show.endPage), 500);
	});
	const tip = solid_js.createMemo(() => {
		if (store.option.scroolEnd === "none") return "";
		switch (delayType()) {
			case "start":
				if (!store.prop.onPrev || store.option.scroolEnd !== "auto") break;
				return helper.t("end_page.tip.start_jump");
			case "end":
				if (store.prop.onNext && store.option.scroolEnd === "auto") return helper.t("end_page.tip.end_jump");
				if (store.prop.onExit) return helper.t("end_page.tip.exit");
		}
		return "";
	});
	return (() => {
		var _el$ = _tmpl$2$6(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$4.nextSibling, _el$6 = _el$5.nextSibling;
		solid_js_web.addEventListener(_el$, "click", handleClick);
		var _ref$ = ref;
		typeof _ref$ === "function" ? solid_js_web.use(_ref$, _el$) : ref = _el$;
		solid_js_web.insert(_el$3, tip);
		solid_js_web.addEventListener(_el$4, "click", () => store.prop.onPrev?.());
		var _ref$2 = bindRef("prev");
		typeof _ref$2 === "function" && solid_js_web.use(_ref$2, _el$4);
		solid_js_web.insert(_el$4, () => helper.t("end_page.prev_button"));
		solid_js_web.addEventListener(_el$5, "click", () => store.prop.onExit?.(store.show.endPage === "end"));
		var _ref$3 = bindRef("exit");
		typeof _ref$3 === "function" && solid_js_web.use(_ref$3, _el$5);
		solid_js_web.insert(_el$5, () => helper.t("other.exit"));
		solid_js_web.addEventListener(_el$6, "click", () => store.prop.onNext?.());
		var _ref$4 = bindRef("next");
		typeof _ref$4 === "function" && solid_js_web.use(_ref$4, _el$6);
		solid_js_web.insert(_el$6, () => helper.t("end_page.next_button"));
		solid_js_web.insert(_el$2, solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return solid_js_web.memo(() => !!(store.option.showComment && delayType() === "end"))() && store.commentList?.length;
			},
			get children() {
				var _el$7 = _tmpl$$34();
				solid_js_web.addEventListener(_el$7, "wheel", stopPropagation);
				solid_js_web.insert(_el$7, solid_js_web.createComponent(solid_js.For, {
					get each() {
						return store.commentList;
					},
					children: (comment) => (() => {
						var _el$8 = _tmpl$3$2();
						solid_js_web.insert(_el$8, comment);
						return _el$8;
					})()
				}));
				solid_js_web.effect(() => solid_js_web.className(_el$7, `${classes$2.comments} ${classes$2.beautifyScrollbar}`));
				return _el$7;
			}
		}), null);
		solid_js_web.effect((_p$) => {
			var _v$ = classes$2.endPage, _v$2 = store.show.endPage, _v$3 = delayType(), _v$4 = helper.boolDataVal(isDrag()), _v$5 = dir() === "rtl" ? "row-reverse" : void 0, _v$6 = classes$2.endPageBody, _v$7 = `${dragY()}px`, _v$8 = classes$2.tip, _v$9 = { [classes$2.invisible]: !store.prop.onPrev }, _v$0 = store.show.endPage ? 0 : -1, _v$1 = store.show.endPage ? 0 : -1, _v$10 = { [classes$2.invisible]: !store.prop.onNext }, _v$11 = store.show.endPage ? 0 : -1;
			_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "data-show", _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "data-type", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$, "data-drag", _p$.o = _v$4);
			_v$5 !== _p$.i && solid_js_web.setStyleProperty(_el$, "flex-direction", _p$.i = _v$5);
			_v$6 !== _p$.n && solid_js_web.className(_el$2, _p$.n = _v$6);
			_v$7 !== _p$.s && solid_js_web.setStyleProperty(_el$2, "--drag-y", _p$.s = _v$7);
			_v$8 !== _p$.h && solid_js_web.className(_el$3, _p$.h = _v$8);
			_p$.r = solid_js_web.classList(_el$4, _v$9, _p$.r);
			_v$0 !== _p$.d && solid_js_web.setAttribute(_el$4, "tabindex", _p$.d = _v$0);
			_v$1 !== _p$.l && solid_js_web.setAttribute(_el$5, "tabindex", _p$.l = _v$1);
			_p$.u = solid_js_web.classList(_el$6, _v$10, _p$.u);
			_v$11 !== _p$.c && solid_js_web.setAttribute(_el$6, "tabindex", _p$.c = _v$11);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0,
			i: void 0,
			n: void 0,
			s: void 0,
			h: void 0,
			r: void 0,
			d: void 0,
			l: void 0,
			u: void 0,
			c: void 0
		});
		return _el$;
	})();
};
//#endregion
//#region src/components/Manga/components/LoadingMask.tsx
var _tmpl$$33 = /*#__PURE__*/ solid_js_web.template(`<div><p>`);
/** imgList 为空时显示的加载提示 */
const LoadingMask = () => (() => {
	var _el$ = _tmpl$$33(), _el$2 = _el$.firstChild;
	solid_js_web.addEventListener(_el$, "wheel", stopPropagation);
	solid_js_web.addEventListener(_el$, "mousedown", stopPropagation);
	solid_js_web.addEventListener(_el$, "click", stopPropagation);
	solid_js_web.insert(_el$2, () => helper.t("alert.repeat_load"));
	solid_js_web.effect(() => solid_js_web.className(_el$, classes$2.loadingMask));
	return _el$;
})();
//#endregion
//#region src/components/Manga/hooks/useHover.ts
const useHover = (ref) => {
	const [isHover, setIsHover] = solid_js.createSignal(false);
	const on = useEventListener(ref);
	on("mouseenter", () => setIsHover(true));
	on("mouseleave", (e) => {
		const el = ref();
		if (!el) return;
		const rect = el.getBoundingClientRect();
		if (!(helper.inRange(rect.left, e.clientX, rect.right) && helper.inRange(rect.top, e.clientY, rect.bottom))) setIsHover(false);
	});
	return isHover;
};
//#endregion
//#region src/components/Manga/components/ScrollbarPageStatus.tsx
var _tmpl$$32 = /*#__PURE__*/ solid_js_web.template(`<div>`);
const getScrollbarPage = (img, i, double = false) => {
	let num;
	if (store.option.scrollMode.enabled) num = getImg(i).size.height;
	else num = double ? 2 : 1;
	let upscale;
	if (isUpscale() && img.upscaleUrl !== void 0) upscale = img.upscaleUrl === "" ? "loading" : true;
	return {
		num,
		loadType: img.loadType,
		translationType: img.translationType,
		upscale
	};
};
const ScrollbarPage = (props) => (() => {
	var _el$ = _tmpl$$32();
	solid_js_web.effect((_p$) => {
		var _v$ = classes$2.scrollbarPage, _v$2 = `${props.num / scrollLength() * 100}%`, _v$3 = props.loadType, _v$4 = props.translationType, _v$5 = props.upscale;
		_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
		_v$2 !== _p$.t && solid_js_web.setStyleProperty(_el$, "flex-basis", _p$.t = _v$2);
		_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "data-type", _p$.a = _v$3);
		_v$4 !== _p$.o && solid_js_web.setAttribute(_el$, "data-translation-type", _p$.o = _v$4);
		_v$5 !== _p$.i && solid_js_web.setAttribute(_el$, "data-upscale", _p$.i = _v$5);
		return _p$;
	}, {
		e: void 0,
		t: void 0,
		a: void 0,
		o: void 0,
		i: void 0
	});
	return _el$;
})();
const isSameItem = (a, b) => a.loadType === b.loadType && a.translationType === b.translationType && a.upscale === b.upscale;
/** 显示对应图片加载情况的元素 */
const ScrollbarPageStatus = () => {
	const scrollbarPageList = helper.createThrottleMemo(() => {
		if (store.pageList.length === 0) return [];
		const list = [];
		let item;
		const handleImg = (i, double = false) => {
			const img = getImg(i);
			const imgItem = getScrollbarPage(img, i, double);
			if (!item) {
				item = imgItem;
				return;
			}
			if (isSameItem(item, imgItem)) {
				if (store.option.scrollMode.enabled) item.num += img.size.height;
				else item.num += double ? 2 : 1;
			} else {
				list.push(item);
				item = getScrollbarPage(img, i, double);
			}
		};
		for (const [a, b] of store.pageList) if (b === void 0) handleImg(a, !isOnePageMode());
		else if (a === -1) {
			handleImg(b);
			handleImg(b);
		} else if (b === -1) {
			handleImg(a);
			handleImg(a);
		} else {
			handleImg(a);
			handleImg(b);
		}
		if (item) list.push(item);
		return list;
	}, 200);
	return solid_js_web.createComponent(solid_js.For, {
		get each() {
			return scrollbarPageList();
		},
		children: (page) => solid_js_web.createComponent(ScrollbarPage, page)
	});
};
//#endregion
//#region src/components/Manga/components/Scrollbar.tsx
var _tmpl$$31 = /*#__PURE__*/ solid_js_web.template(`<div role=scrollbar tabindex=-1>`);
var _tmpl$2$5 = /*#__PURE__*/ solid_js_web.template(`<div>`);
/** 滚动条 */
const Scrollbar = () => {
	solid_js.onMount(() => {
		helper.useDrag({
			ref: refs.scrollbar,
			handleDrag: handleScrollbarSlider,
			easyMode: () => isScrollMode() && store.option.scrollbar.easyScroll,
			setCapture: true
		});
		watchDomSize("scrollbarSize", refs.scrollbar);
	});
	const [penetrate, setPenetrate] = solid_js.createSignal(false);
	let penetrateFrame = 0;
	const handleWheel = () => {
		setPenetrate(true);
		cancelAnimationFrame(penetrateFrame);
		penetrateFrame = requestAnimationFrame(() => setPenetrate(false));
	};
	solid_js.onCleanup(() => cancelAnimationFrame(penetrateFrame));
	const isScrollbarHover = useHover(() => refs.scrollbar);
	solid_js.createEffect(() => setState("isScrollbarHover", isScrollbarHover()));
	/** 滚动条提示文本 */
	const tipText = helper.createThrottleMemo(() => {
		if (store.showRange[0] === store.showRange[1]) return getPageTip(store.showRange[0]);
		if (isDoubleMode()) {
			const rows = [];
			let pageIndex = 0;
			for (const row of scrollPageList()) {
				const start = pageIndex;
				const end = pageIndex + row.length - 1;
				pageIndex += row.length;
				if (store.showRange[1] < start || store.showRange[0] > end) continue;
				const rowTipList = row.map((_, i) => getPageTip(start + i));
				if (store.option.dir === "rtl") rowTipList.reverse();
				rows.push(rowTipList.join("   "));
			}
			return rows.join("\n") || getPageTip(store.showRange[0]);
		}
		/** 并排卷轴模式下的滚动条提示文本 */
		if (isAbreastMode()) {
			const columns = abreastArea().columns.slice(abreastShowColumn().start, abreastShowColumn().end + 1).map((column) => column.map(getPageTip));
			if (store.option.dir !== "rtl") columns.reverse();
			return columns.map((column) => column.join(" ")).join("\n");
		}
		const tipList = [];
		for (let [i] = store.showRange; i <= store.showRange[1]; i++) tipList.push(getPageTip(i));
		if (isOnePageMode()) return tipList.join("\n");
		if (tipList.length === 1) return tipList[0];
		if (store.option.dir === "rtl") tipList.reverse();
		return tipList.join("   ");
	});
	css$1(`.${classes$2.scrollbar}`, {
		"pointer-events": () => penetrate() || store.isDragMode ? "none" : "auto",
		"--scroll-length": () => `${scrollDomLength()}px`,
		"--slider-midpoint": () => `${sliderMidpoint()}px`,
		"--slider-height": () => `${sliderHeight() * scrollDomLength()}px`,
		"--slider-top": sliderTop
	});
	const ScrollbarBase = (props) => (() => {
		var _el$ = _tmpl$$31();
		_el$.addEventListener("wheel", handleWheel);
		var _ref$ = props.ref;
		typeof _ref$ === "function" ? solid_js_web.use(_ref$, _el$) : props.ref = _el$;
		solid_js_web.insert(_el$, () => props.children);
		solid_js_web.effect((_p$) => {
			var _v$ = classes$2.scrollbar, _v$2 = classes$2.mangaFlow, _v$3 = store.activePageIndex || -1, _v$4 = helper.boolDataVal(store.option.scrollbar.autoHidden), _v$5 = helper.boolDataVal(store.show.scrollbar || penetrate() || store.isScrollbarHover), _v$6 = store.option.dir, _v$7 = scrollPosition(), _v$8 = helper.boolDataVal(isAbreastMode()), _v$9 = helper.boolDataVal(isDrag()), _v$0 = props.style;
			_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "aria-controls", _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "aria-valuenow", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$, "data-auto-hidden", _p$.o = _v$4);
			_v$5 !== _p$.i && solid_js_web.setAttribute(_el$, "data-force-show", _p$.i = _v$5);
			_v$6 !== _p$.n && solid_js_web.setAttribute(_el$, "data-dir", _p$.n = _v$6);
			_v$7 !== _p$.s && solid_js_web.setAttribute(_el$, "data-position", _p$.s = _v$7);
			_v$8 !== _p$.h && solid_js_web.setAttribute(_el$, "data-is-abreast-mode", _p$.h = _v$8);
			_v$9 !== _p$.r && solid_js_web.setAttribute(_el$, "data-drag", _p$.r = _v$9);
			_p$.d = solid_js_web.style(_el$, _v$0, _p$.d);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0,
			i: void 0,
			n: void 0,
			s: void 0,
			h: void 0,
			r: void 0,
			d: void 0
		});
		return _el$;
	})();
	return [solid_js_web.createComponent(ScrollbarBase, {
		ref(r$) {
			var _ref$2 = bindRef("scrollbar");
			typeof _ref$2 === "function" && _ref$2(r$);
		},
		get children() {
			return [(() => {
				var _el$2 = _tmpl$2$5();
				solid_js_web.insert(_el$2, tipText);
				solid_js_web.effect(() => solid_js_web.className(_el$2, classes$2.scrollbarPoper));
				return _el$2;
			})(), solid_js_web.createComponent(solid_js.Show, {
				get when() {
					return solid_js_web.memo(() => !!store.option.scrollbar.showImgStatus)() && scrollPosition() !== "hidden";
				},
				get children() {
					return solid_js_web.createComponent(ScrollbarPageStatus, {});
				}
			})];
		}
	}), solid_js_web.createComponent(ScrollbarBase, {
		style: {
			"mix-blend-mode": "difference",
			"pointer-events": "none"
		},
		get children() {
			var _el$3 = _tmpl$2$5();
			solid_js_web.effect(() => solid_js_web.className(_el$3, classes$2.scrollbarSlider));
			return _el$3;
		}
	})];
};
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/close.svg
var _tmpl$$30 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4">`);
var close_default = (props = {}) => (() => {
	var _el$ = _tmpl$$30();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/fullscreen.svg
var _tmpl$$29 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M6 14c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1H7v-2c0-.55-.45-1-1-1m0-4c.55 0 1-.45 1-1V7h2c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1m11 7h-2c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1s-1 .45-1 1zM14 6c0 .55.45 1 1 1h2v2c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1">`);
var fullscreen_default = (props = {}) => (() => {
	var _el$ = _tmpl$$29();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/fullscreen_exit.svg
var _tmpl$$28 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M6 16h2v2c0 .55.45 1 1 1s1-.45 1-1v-3c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1s.45 1 1 1m2-8H6c-.55 0-1 .45-1 1s.45 1 1 1h3c.55 0 1-.45 1-1V6c0-.55-.45-1-1-1s-1 .45-1 1zm7 11c.55 0 1-.45 1-1v-2h2c.55 0 1-.45 1-1s-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1m1-11V6c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h3c.55 0 1-.45 1-1s-.45-1-1-1z">`);
var fullscreen_exit_default = (props = {}) => (() => {
	var _el$ = _tmpl$$28();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/looks_one.svg
var _tmpl$$27 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-6 14c-.55 0-1-.45-1-1V9h-1c-.55 0-1-.45-1-1s.45-1 1-1h2c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1">`);
var looks_one_default = (props = {}) => (() => {
	var _el$ = _tmpl$$27();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/looks_two.svg
var _tmpl$$26 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-4 8c0 1.1-.9 2-2 2h-2v2h3c.55 0 1 .45 1 1s-.45 1-1 1h-4c-.55 0-1-.45-1-1v-3c0-1.1.9-2 2-2h2V9h-3c-.55 0-1-.45-1-1s.45-1 1-1h3c1.1 0 2 .9 2 2z">`);
var looks_two_default = (props = {}) => (() => {
	var _el$ = _tmpl$$26();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/low_priority.svg
var _tmpl$$25 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M15 5h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1m0 5.5h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1m0 5.5h6c.55 0 1 .45 1 1s-.45 1-1 1h-6c-.55 0-1-.45-1-1s.45-1 1-1m-5.15 3.15 1.79-1.79c.2-.2.2-.51 0-.71l-1.79-1.79a.495.495 0 0 0-.85.35v3.59c0 .44.54.66.85.35M9 16h-.3c-2.35 0-4.45-1.71-4.68-4.05A4.51 4.51 0 0 1 8.5 7H11c.55 0 1-.45 1-1s-.45-1-1-1H8.5c-3.86 0-6.96 3.4-6.44 7.36C2.48 15.64 5.43 18 8.73 18H9">`);
var low_priority_default = (props = {}) => (() => {
	var _el$ = _tmpl$$25();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/queue.svg
var _tmpl$$24 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M3 6c-.55 0-1 .45-1 1v13c0 1.1.9 2 2 2h13c.55 0 1-.45 1-1s-.45-1-1-1H5c-.55 0-1-.45-1-1V7c0-.55-.45-1-1-1m17-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2m-2 9h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3h-3c-.55 0-1-.45-1-1s.45-1 1-1h3V6c0-.55.45-1 1-1s1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1">`);
var queue_default = (props = {}) => (() => {
	var _el$ = _tmpl$$24();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/settings.svg
var _tmpl$$23 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M19.5 12c0-.23-.01-.45-.03-.68l1.86-1.41c.4-.3.51-.86.26-1.3l-1.87-3.23a.987.987 0 0 0-1.25-.42l-2.15.91c-.37-.26-.76-.49-1.17-.68l-.29-2.31c-.06-.5-.49-.88-.99-.88h-3.73c-.51 0-.94.38-1 .88l-.29 2.31c-.41.19-.8.42-1.17.68l-2.15-.91c-.46-.2-1-.02-1.25.42L2.41 8.62c-.25.44-.14.99.26 1.3l1.86 1.41a7.3 7.3 0 0 0 0 1.35l-1.86 1.41c-.4.3-.51.86-.26 1.3l1.87 3.23c.25.44.79.62 1.25.42l2.15-.91c.37.26.76.49 1.17.68l.29 2.31c.06.5.49.88.99.88h3.73c.5 0 .93-.38.99-.88l.29-2.31c.41-.19.8-.42 1.17-.68l2.15.91c.46.2 1 .02 1.25-.42l1.87-3.23c.25-.44.14-.99-.26-1.3l-1.86-1.41c.03-.23.04-.45.04-.68m-7.46 3.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5">`);
var settings_default = (props = {}) => (() => {
	var _el$ = _tmpl$$23();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/translate.svg
var _tmpl$$22 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M12.65 15.67c.14-.36.05-.77-.23-1.05l-2.09-2.06.03-.03A17.5 17.5 0 0 0 14.07 6h1.94c.54 0 .99-.45.99-.99v-.02c0-.54-.45-.99-.99-.99H10V3c0-.55-.45-1-1-1s-1 .45-1 1v1H1.99c-.54 0-.99.45-.99.99 0 .55.45.99.99.99h10.18A15.7 15.7 0 0 1 9 11.35c-.81-.89-1.49-1.86-2.06-2.88A.89.89 0 0 0 6.16 8c-.69 0-1.13.75-.79 1.35.63 1.13 1.4 2.21 2.3 3.21L3.3 16.87a.99.99 0 0 0 0 1.42c.39.39 1.02.39 1.42 0L9 14l2.02 2.02c.51.51 1.38.32 1.63-.35M17.5 10c-.6 0-1.14.37-1.35.94l-3.67 9.8c-.24.61.22 1.26.87 1.26.39 0 .74-.24.88-.61l.89-2.39h4.75l.9 2.39c.14.36.49.61.88.61.65 0 1.11-.65.88-1.26l-3.67-9.8c-.22-.57-.76-.94-1.36-.94m-1.62 7 1.62-4.33L19.12 17z">`);
var translate_default = (props = {}) => (() => {
	var _el$ = _tmpl$$22();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/view_day.svg
var _tmpl$$21 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M3 21h17c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1M20 8H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1M2 4v1c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1">`);
var view_day_default = (props = {}) => (() => {
	var _el$ = _tmpl$$21();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/zoom_in.svg
var _tmpl$$20 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34-4.23-.52-7.78 3.04-7.27 7.27.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.26 4.25c.41.41 1.07.41 1.48 0l.01-.01c.41-.41.41-1.07 0-1.48zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14m0-7c-.28 0-.5.22-.5.5V9H7.5c-.28 0-.5.22-.5.5s.22.5.5.5H9v1.5c0 .28.22.5.5.5s.5-.22.5-.5V10h1.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H10V7.5c0-.28-.22-.5-.5-.5">`);
var zoom_in_default = (props = {}) => (() => {
	var _el$ = _tmpl$$20();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/zoom_out.svg
var _tmpl$$19 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.26 4.25c.41.41 1.07.41 1.48 0l.01-.01c.41-.41.41-1.07 0-1.48zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14m-2-5h4c.28 0 .5.22.5.5s-.22.5-.5.5h-4c-.28 0-.5-.22-.5-.5s.22-.5.5-.5">`);
var zoom_out_default = (props = {}) => (() => {
	var _el$ = _tmpl$$19();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region src/components/IconButton/index.module.css
const classes$1 = {
	"iconButtonItem": "iconButtonItem___vTPHz",
	"iconButton": "iconButton___dhWw3",
	"enabled": "enabled___eXH34",
	"disable": "disable___7C-Rj",
	"iconButtonPopper": "iconButtonPopper___dVIu-",
	"hidden": "hidden___v7N-q"
};
//#endregion
//#region src/components/IconButton/index.module.css?inline
var index_module_default$1 = ".iconButtonItem___vTPHz {\n  position: relative;\n  display: flex;\n  align-items: center;\n}\n\n.iconButton___dhWw3 {\n  cursor: pointer;\n\n  display: flex;\n  align-items: center;\n  justify-content: center;\n\n  width: 1.5em;\n  height: 1.5em;\n  margin: 0.1em;\n  padding: 0;\n  border-style: none;\n  border-radius: 9999px;\n\n  font-size: 1.5em;\n  color: var(--text, white);\n\n  background-color: transparent;\n  outline: none;\n}\n\n.iconButton___dhWw3:focus,.iconButton___dhWw3:hover {\n    background-color: var(--hover-bg-color, #fff3);\n  }\n\n.iconButton___dhWw3.enabled___eXH34:not(.disable___7C-Rj) {\n    color: var(--text-bg, #121212);\n    background-color: var(--text, white);\n  }\n\n.iconButton___dhWw3.enabled___eXH34:not(.disable___7C-Rj):focus,.iconButton___dhWw3.enabled___eXH34:not(.disable___7C-Rj):hover {\n      background-color: var(--hover-bg-color-enable, #fffa);\n    }\n\n.iconButton___dhWw3.disable___7C-Rj {\n    cursor: not-allowed;\n    opacity: 0.5;\n    background-color: unset;\n  }\n\n.iconButton___dhWw3 > svg {\n    width: 1em;\n  }\n\n/* 默认悬浮框样式 */\n.iconButtonPopper___dVIu- {\n  pointer-events: none;\n  -webkit-user-select: none;\n          user-select: none;\n\n  position: absolute;\n  top: 50%;\n  transform: translateY(-50%);\n\n  display: flex;\n  align-items: center;\n\n  padding: 0.4em 0.5em;\n  border-radius: 0.3em;\n\n  font-size: 0.8em;\n  color: white;\n  white-space: nowrap;\n\n  opacity: 0;\n  background-color: #303030;\n}\n.iconButtonPopper___dVIu-[data-placement='right'] {\n    left: calc(100% + 1.5em);\n  }\n.iconButtonPopper___dVIu-[data-placement='right']::before {\n      right: calc(100% + 0.5em);\n      border-right-color: var(--switch-bg, #6e6e6e);\n      border-right-width: 0.5em;\n    }\n.iconButtonPopper___dVIu-[data-placement='left'] {\n    right: calc(100% + 1.5em);\n  }\n.iconButtonPopper___dVIu-[data-placement='left']::before {\n      left: calc(100% + 0.5em);\n      border-left-color: var(--switch-bg, #6e6e6e);\n      border-left-width: 0.5em;\n    }\n\n/* 工具栏按钮的悬浮框的箭头 */\n.iconButtonPopper___dVIu-::before {\n  pointer-events: none;\n  content: '';\n\n  position: absolute;\n\n  border-color: transparent;\n  border-style: solid;\n  border-width: 0.4em;\n\n  background-color: transparent;\n\n  transition: opacity 150ms;\n}\n\n/* 控制悬浮框的显示 */\n.iconButtonItem___vTPHz:is(:hover, :focus, [data-show='true']) .iconButtonPopper___dVIu- {\n  opacity: 1;\n}\n\n.hidden___v7N-q {\n  display: none;\n}\n";
//#endregion
//#region src/components/IconButton/index.tsx
var _tmpl$$18 = /*#__PURE__*/ solid_js_web.template(`<div><button type=button tabindex=0>`);
var _tmpl$2$4 = /*#__PURE__*/ solid_js_web.template(`<div>`);
/** 图标按钮 */
const IconButton$1 = (_props) => {
	const props = solid_js.mergeProps({ placement: "right" }, _props);
	let buttonRef;
	const handleClick = (e) => {
		if (props.disable) return;
		props.onClick?.(e);
		buttonRef?.blur();
	};
	return (() => {
		var _el$ = _tmpl$$18(), _el$2 = _el$.firstChild;
		solid_js_web.use((ref) => helper.css(index_module_default$1, ref), _el$);
		solid_js_web.addEventListener(_el$2, "click", handleClick);
		var _ref$ = buttonRef;
		typeof _ref$ === "function" ? solid_js_web.use(_ref$, _el$2) : buttonRef = _el$2;
		solid_js_web.insert(_el$2, () => props.children);
		solid_js_web.insert(_el$, (() => {
			var _c$ = solid_js_web.memo(() => !!(props.popper || props.tip));
			return () => _c$() ? (() => {
				var _el$3 = _tmpl$2$4();
				solid_js_web.insert(_el$3, () => props.popper || props.tip);
				solid_js_web.effect((_p$) => {
					var _v$7 = [classes$1.iconButtonPopper, props.popperClassName].join(" "), _v$8 = props.placement;
					_v$7 !== _p$.e && solid_js_web.className(_el$3, _p$.e = _v$7);
					_v$8 !== _p$.t && solid_js_web.setAttribute(_el$3, "data-placement", _p$.t = _v$8);
					return _p$;
				}, {
					e: void 0,
					t: void 0
				});
				return _el$3;
			})() : null;
		})(), null);
		solid_js_web.effect((_p$) => {
			var _v$ = classes$1.iconButtonItem, _v$2 = props.showTip, _v$3 = props.tip, _v$4 = classes$1.iconButton, _v$5 = props.style, _v$6 = {
				[classes$1.hidden]: props.hidden,
				[classes$1.enabled]: props.enabled,
				[classes$1.disable]: props.disable
			};
			_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "data-show", _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$2, "aria-label", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.className(_el$2, _p$.o = _v$4);
			_p$.i = solid_js_web.style(_el$2, _v$5, _p$.i);
			_p$.n = solid_js_web.classList(_el$2, _v$6, _p$.n);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0,
			i: void 0,
			n: void 0
		});
		return _el$;
	})();
};
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/play_arrow.svg
var _tmpl$$17 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 0 0 0-1.69L9.54 5.98A.998.998 0 0 0 8 6.82">`);
var play_arrow_default = (props = {}) => (() => {
	var _el$ = _tmpl$$17();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/stop.svg
var _tmpl$$16 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M8 6h8c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2">`);
var stop_default = (props = {}) => (() => {
	var _el$ = _tmpl$$16();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region src/components/Manga/components/autoScroll.tsx
/** 自动滚动最低速度（px/ms），避免 distance 为 0 或异常配置导致卡住 */
const autoScrollSpeed = () => {
	const ms = Number(store.option.autoScroll.interval);
	const px = Number(store.option.autoScroll.distance);
	return (Number.isFinite(px) && px > 0 ? px : 1) / (Number.isFinite(ms) && ms > 0 ? ms : 16);
};
const autoScroll = new class extends helper.AnimationFrame {
	position = 0;
	lastExpectedTop = 0;
	lastFrameTime = null;
	lastProgressTime = 0;
	progressElapsed = 0;
	continuousFrame = (timestamp) => {
		if (!this.animationId || !store.autoScroll.play || !store.option.autoScroll.enabled) return this.cancel();
		if (document.hidden || contentHeight() <= 0 || store.rootSize.height <= 0) {
			this.lastFrameTime = null;
			this.call(true);
			return;
		}
		// Follow external layout compensation, while retaining subpixel accumulation.
		const reported = scrollTop();
		if (Math.abs(reported - this.lastExpectedTop) > 1) this.position = reported;
		const max = Math.max(0, contentHeight() - store.rootSize.height);
		const elapsed = this.lastFrameTime === null ? 0 : timestamp - this.lastFrameTime;
		this.lastFrameTime = timestamp;
		const dt = elapsed > 100 || elapsed < 0 ? 0 : Math.min(50, elapsed);
		this.position = Math.max(0, Math.min(max, this.position + autoScrollSpeed() * dt));
		this.lastExpectedTop = this.position;
		// Use ComicRead's original position/rendering pipeline for iPad compatibility.
		scrollTo(this.position);
		if (!this.animationId || !store.autoScroll.play) return;
		this.progressElapsed = (this.progressElapsed + dt) % 1000;
		if (timestamp - this.lastProgressTime >= 100) {
			this.lastProgressTime = timestamp;
			setState("autoScroll", "progress", this.progressElapsed / 1000);
		}
		if (!this.animationId || !store.autoScroll.play) return;
		const latestMax = Math.max(0, contentHeight() - store.rootSize.height);
		if (this.position >= latestMax && scrollTop() >= latestMax - 1) return this.scrollEnd();
		this.call(true);
	};

	/** 上次滚动的时间 */
	lastTime = 0;
	scrollEnd = () => {
		this.stop();
		if (!store.prop.onExit) return;
		setState("show", "endPage", "end");
		if (store.option.autoScroll.triggerEnd) setTimeout(handleEndTurnPage, 500, "next");
	};
	scroll = () => {
		if (isBottom()) return this.scrollEnd();
		if (store.option.scrollMode.enabled) return scrollBy(Math.max(1, store.option.autoScroll.distance), true);
		return turnPageAnimation("next");
	};
	frame = (timestamp) => {
		if (isScrollMode()) return this.continuousFrame(timestamp);
		const elapsed = timestamp - this.lastTime;
		let progress;
		if (elapsed >= store.option.autoScroll.interval) {
			this.lastTime = timestamp;
			this.scroll();
			progress = 1;
		}
		if (!store.autoScroll.play) return;
		progress ||= elapsed / store.option.autoScroll.interval;
		setState("autoScroll", "progress", progress);
		this.call(true);
	};
	start = () => {
		this.lastTime = 0;
		if (isScrollMode()) {
			scrollStep.cancel();
			slideAnim.cancel();
			this.position = scrollTop();
			this.lastExpectedTop = this.position;
			this.lastFrameTime = null;
			this.lastProgressTime = 0;
			this.progressElapsed = 0;
			return this.call();
		}
		if (!store.option.autoScroll.continuous || !store.option.scrollMode.enabled) return this.call();
		constantScroll.start(autoScrollSpeed(), (delta) => {
			if (isBottom()) {
				this.scrollEnd();
				return false;
			}
			const { distance } = store.option.autoScroll;
			if (distance > 0) setState("autoScroll", "progress", (store.autoScroll.progress + delta / distance) % 1);
		});
	};
	stop = () => {
		this.cancel();
		constantScroll.cancel();
		setState("autoScroll", "play", false);
	};
}();
helper.createEffectOn(() => [
	...Object.values(store.option.autoScroll),
	store.autoScroll.play,
	isScrollMode(),
	isAbreastMode()
], () => {
	autoScroll.cancel();
	constantScroll.cancel();
	if (!store.option.autoScroll.enabled || !store.autoScroll.play) return;
	autoScroll.start();
});
// Opening the controls must not interrupt continuous playback.
const AutoScrollButton = () => {
	const background = solid_js.createMemo(() => {
		if (!store.autoScroll.play) return;
		const deg = store.autoScroll.progress * 360 % 360;
		return `conic-gradient(var(--text-secondary) 0deg, var(--text-secondary) ${deg}deg, var(--text) ${deg}deg)`;
	});
	return solid_js_web.createComponent(IconButton$1, {
		get tip() {
			return helper.t("button.auto_scroll");
		},
		get enabled() {
			return store.autoScroll.play;
		},
		get style() {
			return { background: background() };
		},
		onClick: switchAutoScroll,
		get children() {
			return solid_js_web.memo(() => !!store.autoScroll.play)() ? solid_js_web.createComponent(stop_default, {}) : solid_js_web.createComponent(play_arrow_default, {});
		}
	});
};
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/file_download.svg
var _tmpl$$15 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M16.59 9H15V4c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v5H7.41c-.89 0-1.34 1.08-.71 1.71l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.63-.63.19-1.71-.7-1.71M5 19c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1">`);
var file_download_default = (props = {}) => (() => {
	var _el$ = _tmpl$$15();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region src/components/Manga/components/DownloadButton.tsx
const getExtName = (mime) => /.+\/(?<ext>[^;]+)/u.exec(mime)?.groups?.ext ?? "jpg";
/** 下载按钮 */
const DownloadButton = () => {
	const { store: state, setState } = helper.useStore({
		length: 0,
		/** undefined 表示未开始下载，等于 length 表示正在打包，-1 表示下载完成 */
		completedNum: void 0,
		errorNum: 0,
		rawTitle: document.title,
		showRawTitle: true
	});
	const progress = new helper.FaviconProgress();
	const handleDownload = async () => {
		const fileData = {};
		setState({
			errorNum: 0,
			length: imgList().length
		});
		if (state.showRawTitle) setState("rawTitle", document.title);
		const imgIndexNum = `${state.length}`.length;
		for (let i = 0; i < state.length; i += 1) {
			setState("completedNum", i);
			const img = imgList()[i];
			if (store.option.translation.onlyDownloadTranslated && img.translationType !== "show") continue;
			let url;
			if (img.translationType === "show") url = img.translationUrl;
			else if (img.upscaleUrl && isUpscale()) url = img.upscaleUrl;
			else url = img.src;
			if (!url?.trim()) continue;
			let data;
			let fileName;
			const index = `${i}`.padStart(imgIndexNum, "0");
			try {
				data = await downloadImg(url, void 0, 3);
				fileName = img.name || `${index}.${getExtName(data.type)}`;
			} catch {
				fileName = `${index} - ${helper.t("alert.download_failed")}`;
				setState("errorNum", (num) => num + 1);
			}
			let name = fileName;
			for (let duplicate = 1; fileData[name]; duplicate += 1) name = `${fileName} (${duplicate})`;
			fileData[name] = new Uint8Array(await data?.arrayBuffer() ?? []);
		}
		if (Object.keys(fileData).length === 0) {
			components_Toast.toast.warn(helper.t("alert.no_img_download"));
			setState("completedNum", void 0);
			return;
		}
		setState("completedNum", state.length);
		const zipped = fflate.zipSync(fileData, {
			level: 0,
			comment: location.href
		});
		helper.saveAs(new Blob([zipped]), `${store.title || state.rawTitle}.zip`);
		setState("completedNum", -1);
		components_Toast.toast(state.errorNum > 0 ? helper.t("button.download_completed_error", { errorNum: state.errorNum }) : helper.t("button.download_completed"), {
			type: state.errorNum > 0 ? "warn" : "success",
			onDismiss() {
				document.title = state.rawTitle;
				setState("showRawTitle", true);
				progress.recover();
			}
		});
	};
	const tip = solid_js.createMemo(() => {
		switch (state.completedNum) {
			case void 0: return helper.t("other.download");
			case state.length: return helper.t("button.packaging");
			case -1: return helper.t("button.download_completed");
			default: return `${helper.t("button.downloading")} - ${state.completedNum}/${state.length}`;
		}
	});
	helper.createEffectOn(() => state.completedNum, (num) => {
		let showTip = "";
		switch (num) {
			case void 0: return;
			case state.length:
				showTip = "📦";
				break;
			case -1:
				showTip = state.errorNum > 0 ? `❗[${state.errorNum}]` : "✅";
				break;
			default: showTip = `${num}/${state.length}`;
		}
		document.title = `${showTip} - ${state.rawTitle}`;
		setState("showRawTitle", false);
	}, { defer: true });
	helper.createEffectOn(() => state.completedNum, (num) => num && num > 0 && progress.update(num / state.length), { defer: true });
	return solid_js_web.createComponent(components_IconButton.IconButton, {
		get tip() {
			return tip();
		},
		onClick: handleDownload,
		get enabled() {
			return state.completedNum !== void 0;
		},
		get children() {
			return solid_js_web.createComponent(file_download_default, {});
		}
	});
};
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/format_textdirection_l_to_r.svg
var _tmpl$$14 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M9 10v4c0 .55.45 1 1 1s1-.45 1-1V4h2v10c0 .55.45 1 1 1s1-.45 1-1V4h1c.55 0 1-.45 1-1s-.45-1-1-1H9.17C7.08 2 5.22 3.53 5.02 5.61A4 4 0 0 0 9 10m11.65 7.65-2.79-2.79a.501.501 0 0 0-.86.35V17H6c-.55 0-1 .45-1 1s.45 1 1 1h11v1.79c0 .45.54.67.85.35l2.79-2.79c.2-.19.2-.51.01-.7">`);
var format_textdirection_l_to_r_default = (props = {}) => (() => {
	var _el$ = _tmpl$$14();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/format_textdirection_r_to_l.svg
var _tmpl$$13 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M10 10v4c0 .55.45 1 1 1s1-.45 1-1V4h2v10c0 .55.45 1 1 1s1-.45 1-1V4h1c.55 0 1-.45 1-1s-.45-1-1-1h-6.83C8.08 2 6.22 3.53 6.02 5.61A4 4 0 0 0 10 10m-2 7v-1.79c0-.45-.54-.67-.85-.35l-2.79 2.79c-.2.2-.2.51 0 .71l2.79 2.79a.5.5 0 0 0 .85-.36V19h11c.55 0 1-.45 1-1s-.45-1-1-1z">`);
var format_textdirection_r_to_l_default = (props = {}) => (() => {
	var _el$ = _tmpl$$13();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/add.svg
var _tmpl$$12 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M18 13h-5v5c0 .55-.45 1-1 1s-1-.45-1-1v-5H6c-.55 0-1-.45-1-1s.45-1 1-1h5V6c0-.55.45-1 1-1s1 .45 1 1v5h5c.55 0 1 .45 1 1s-.45 1-1 1">`);
var add_default = (props = {}) => (() => {
	var _el$ = _tmpl$$12();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region node_modules/.pnpm/@material-design-icons+svg@0.14.15/node_modules/@material-design-icons/svg/round/refresh.svg
var _tmpl$$11 = /*#__PURE__*/ solid_js_web.template(`<svg xmlns=http://www.w3.org/2000/svg viewBox="0 0 24 24"stroke=currentColor fill=currentColor stroke-width=0><path d="M17.65 6.35a7.95 7.95 0 0 0-6.48-2.31c-3.67.37-6.69 3.35-7.1 7.02C3.52 15.91 7.27 20 12 20a7.98 7.98 0 0 0 7.21-4.56c.32-.67-.16-1.44-.9-1.44-.37 0-.72.2-.88.53a5.994 5.994 0 0 1-6.8 3.31c-2.22-.49-4.01-2.3-4.48-4.52A6.002 6.002 0 0 1 12 6c1.66 0 3.14.69 4.22 1.78l-1.51 1.51c-.63.63-.19 1.71.7 1.71H19c.55 0 1-.45 1-1V6.41c0-.89-1.08-1.34-1.71-.71z">`);
var refresh_default = (props = {}) => (() => {
	var _el$ = _tmpl$$11();
	solid_js_web.spread(_el$, props, true, true);
	return _el$;
})();
//#endregion
//#region src/components/Manga/components/SettingHotkeys.tsx
var _tmpl$$10 = /*#__PURE__*/ solid_js_web.template(`<div tabindex=0>`);
var _tmpl$2$3 = /*#__PURE__*/ solid_js_web.template(`<div><div><p></p><span style=flex-grow:1></span><div></div><div>`);
var _tmpl$3$1 = /*#__PURE__*/ solid_js_web.template(`<div><select style=height:100%><option value disabled hidden selected> …`);
var _tmpl$4 = /*#__PURE__*/ solid_js_web.template(`<option>`);
const setHotkeys = (...args) => {
	setState(...["hotkeys", ...args]);
	store.prop.onHotkeysChange?.(Object.fromEntries(Object.entries(store.hotkeys).filter(([name, keys]) => !helper.isEqual(keys.filter(Boolean), defaultHotkeys()[name]))));
};
const delHotkeys = (code) => {
	for (const [name, keys] of Object.entries(store.hotkeys)) {
		const i = keys.indexOf(code);
		if (i === -1) continue;
		const newKeys = [...store.hotkeys[name]];
		newKeys.splice(i, 1);
		setHotkeys(name, newKeys);
	}
};
const getHotkeyName = (code) => helper.t(`hotkeys.${code}`) || helper.t(`button.${code}`) || helper.t(`setting.translation.${code}`) || helper.t(`other.${code}`) || code;
const KeyItem = (props) => {
	const code = () => store.hotkeys[props.operateName][props.i];
	const del = () => delHotkeys(code());
	const handleKeyDown = (e) => {
		e.stopPropagation();
		e.preventDefault();
		switch (e.key) {
			case "Tab":
			case "Enter":
			case "Escape":
				focus();
				return;
			case "Backspace":
				setHotkeys(props.operateName, props.i, "");
				return;
		}
		const newCode = helper.getKeyboardCode(e);
		if (Reflect.has(hotkeysMap(), newCode)) components_Toast.toast.error(helper.t("hotkeys.repeat_tip", { hotkey: getHotkeyName(hotkeysMap()[newCode]) }));
		else setHotkeys(props.operateName, props.i, newCode);
	};
	return (() => {
		var _el$ = _tmpl$$10();
		_el$.addEventListener("blur", () => code() || del());
		solid_js_web.use((ref) => code() || setTimeout(() => ref.focus()), _el$);
		solid_js_web.addEventListener(_el$, "keydown", handleKeyDown);
		solid_js_web.insert(_el$, () => helper.keyboardCodeToText(code()), null);
		solid_js_web.insert(_el$, solid_js_web.createComponent(close_default, { "on:click": del }), null);
		solid_js_web.effect(() => solid_js_web.className(_el$, classes$2.hotkeysItem));
		return _el$;
	})();
};
const SettingHotkeys = (props) => solid_js_web.createComponent(solid_js.For, {
	get each() {
		return props.keys;
	},
	children: (name) => (() => {
		var _el$2 = _tmpl$2$3(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$6 = _el$4.nextSibling.nextSibling, _el$7 = _el$6.nextSibling;
		solid_js_web.insert(_el$4, () => getHotkeyName(name));
		solid_js_web.addEventListener(_el$6, "click", () => setHotkeys(name, store.hotkeys[name].length, ""));
		solid_js_web.insert(_el$6, solid_js_web.createComponent(add_default, {}));
		solid_js_web.addEventListener(_el$7, "click", () => {
			const newKeys = defaultHotkeys()[name] ?? [];
			for (const code of defaultHotkeys()[name]) delHotkeys(code);
			setHotkeys(name, newKeys);
		});
		solid_js_web.insert(_el$7, solid_js_web.createComponent(refresh_default, {}));
		solid_js_web.insert(_el$2, solid_js_web.createComponent(solid_js.Index, {
			get each() {
				return store.hotkeys[name];
			},
			children: (_, i) => solid_js_web.createComponent(KeyItem, {
				operateName: name,
				i
			})
		}), null);
		solid_js_web.effect((_p$) => {
			var _v$ = classes$2.hotkeys, _v$2 = classes$2.hotkeysHeader, _v$3 = helper.t("setting.hotkeys.add"), _v$4 = helper.t("setting.hotkeys.restore");
			_v$ !== _p$.e && solid_js_web.className(_el$2, _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.className(_el$3, _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$6, "title", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$7, "title", _p$.o = _v$4);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0
		});
		return _el$2;
	})()
});
const OtherHotkeys = (props) => {
	let ref;
	const handleChange = (e) => {
		const name = e.target.value;
		setHotkeys(name, store.hotkeys[name].length, "");
		ref.value = "";
	};
	return (() => {
		var _el$8 = _tmpl$3$1(), _el$9 = _el$8.firstChild, _el$0 = _el$9.firstChild, _el$1 = _el$0.firstChild;
		_el$9.addEventListener("change", handleChange);
		var _ref$ = ref;
		typeof _ref$ === "function" ? solid_js_web.use(_ref$, _el$9) : ref = _el$9;
		solid_js_web.insert(_el$0, () => helper.t("other.other"), _el$1);
		solid_js_web.insert(_el$9, solid_js_web.createComponent(solid_js.For, {
			get each() {
				return props.keys;
			},
			children: (name) => (() => {
				var _el$10 = _tmpl$4();
				_el$10.value = name;
				solid_js_web.insert(_el$10, () => getHotkeyName(name));
				return _el$10;
			})()
		}), null);
		solid_js_web.effect((_p$) => {
			var _v$5 = classes$2.hotkeys, _v$6 = classes$2.hotkeysHeader;
			_v$5 !== _p$.e && solid_js_web.className(_el$8, _p$.e = _v$5);
			_v$6 !== _p$.t && solid_js_web.className(_el$9, _p$.t = _v$6);
			return _p$;
		}, {
			e: void 0,
			t: void 0
		});
		return _el$8;
	})();
};
const SettingHotkeysBlock = () => {
	const hotkeys = helper.createRootMemo(() => {
		const show = [];
		const other = [];
		for (const [name, keys] of Object.entries(store.hotkeys)) (keys.length > 0 ? show : other).push(name);
		return {
			show,
			other
		};
	});
	return [solid_js_web.createComponent(SettingHotkeys, { get keys() {
		return hotkeys().show;
	} }), solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return hotkeys().other.length;
		},
		get children() {
			return solid_js_web.createComponent(OtherHotkeys, { get keys() {
				return hotkeys().other;
			} });
		}
	})];
};
//#endregion
//#region src/components/Manga/components/SettingsItemButton.tsx
var _tmpl$$9 = /*#__PURE__*/ solid_js_web.template(`<button type=button>`);
/** 按钮式菜单项 */
const SettingsItemButton = (props) => {
	const [, others] = solid_js.splitProps(props, ["children", "onClick"]);
	return solid_js_web.createComponent(SettingsItem, solid_js_web.mergeProps(others, { get children() {
		var _el$ = _tmpl$$9();
		solid_js_web.addEventListener(_el$, "click", props.onClick);
		solid_js_web.insert(_el$, () => props.children);
		solid_js_web.effect(() => solid_js_web.className(_el$, classes$2.SettingsItemIconButton));
		return _el$;
	} }));
};
//#endregion
//#region src/components/Manga/components/SettingsShowItem.tsx
var _tmpl$$8 = /*#__PURE__*/ solid_js_web.template(`<div><div>`);
/** 带有动画过渡的切换显示设置项 */
const SettingsShowItem = (props) => (() => {
	var _el$ = _tmpl$$8(), _el$2 = _el$.firstChild;
	solid_js_web.insert(_el$2, () => props.children);
	solid_js_web.effect((_p$) => {
		var _v$ = classes$2.SettingsShowItem, _v$2 = props.when ? "1fr" : "0fr", _v$3 = classes$2.SettingsShowItemBody;
		_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
		_v$2 !== _p$.t && solid_js_web.setStyleProperty(_el$, "grid-template-rows", _p$.t = _v$2);
		_v$3 !== _p$.a && solid_js_web.className(_el$2, _p$.a = _v$3);
		return _p$;
	}, {
		e: void 0,
		t: void 0,
		a: void 0
	});
	return _el$;
})();
//#endregion
//#region src/components/RangeInput.tsx
var _tmpl$$7 = /*#__PURE__*/ solid_js_web.template(`<textarea autocomplete=off rows=2>`);
/** 范围输入框 */
const RangeInput = (props) => {
	let ref;
	/** 在保持光标位置不变的情况下修改文本 */
	const editText = (text) => {
		const offset = ref.selectionStart;
		ref.value = text;
		if (offset) requestAnimationFrame(() => {
			ref.selectionStart = offset;
			ref.selectionEnd = offset;
		});
	};
	/** 修改文本中的数字 */
	const replaceTextNumer = (text, offset, fn) => {
		const isNumber = (num) => /\d/u.test(text[num]);
		let start = offset;
		if (!isNumber(offset)) {
			if (isNumber(start - 1)) start--;
			else if (isNumber(start + 1)) start++;
			else return text;
		}
		let end = start;
		while (isNumber(start - 1)) start--;
		while (isNumber(end + 1)) end++;
		return text.slice(0, start) + fn(Number(text.slice(start, end + 1))) + text.slice(end + 1);
	};
	const handleKeyDown = (e) => {
		switch (e.key) {
			case "ArrowUp":
			case "ArrowDown": editText(replaceTextNumer(ref.value, ref.selectionStart, (num) => e.key === "ArrowUp" ? num + 1 : num - 1));
		}
	};
	return (() => {
		var _el$ = _tmpl$$7();
		_el$.addEventListener("blur", () => {
			try {
				props.onChange?.(ref.value);
			} finally {
				ref.value = props.value;
			}
		});
		solid_js_web.addEventListener(_el$, "keydown", handleKeyDown);
		var _ref$ = ref;
		typeof _ref$ === "function" ? solid_js_web.use(_ref$, _el$) : ref = _el$;
		solid_js_web.effect((_p$) => {
			var _v$ = props.style, _v$2 = props.placeholder;
			_p$.e = solid_js_web.style(_el$, _v$, _p$.e);
			_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "placeholder", _p$.t = _v$2);
			return _p$;
		}, {
			e: void 0,
			t: void 0
		});
		solid_js_web.effect(() => _el$.value = props.value);
		return _el$;
	})();
};
//#endregion
//#region src/components/Manga/components/SettingTranslation.tsx
var _tmpl$$6 = /*#__PURE__*/ solid_js_web.template(`<hr style="margin:1em 0">`);
const bindOption$1 = (...args) => bindOption("translation", ...args);
const [rangeText, setRangeText] = solid_js.createSignal("");
helper.createEffectOn(translationImgs, (imgs) => setRangeText(helper.descRange(imgs, store.imgList.length)));
const TranslateRange = () => {
	helper.createEffectOn(rangeText, () => {
		const imgImgs = helper.extractRange(rangeText(), store.imgList.length);
		const openImgs = [...imgImgs].filter((i) => {
			switch (imgList()[i].translationType) {
				case "show":
				case "wait": return false;
				default: return true;
			}
		});
		if (openImgs.length > 0) setImgTranslationEnbale(openImgs, true);
		const closeImgs = /* @__PURE__ */ new Set();
		for (let i = 0; i < store.imgList.length; i++) if (!imgImgs.has(i)) closeImgs.add(i);
		if (closeImgs.size > 0) setImgTranslationEnbale(closeImgs, false);
		setRangeText(helper.descRange(imgImgs, store.imgList.length));
	});
	return [solid_js_web.createComponent(SettingsItem, { get name() {
		return helper.t("setting.translation.range");
	} }), solid_js_web.createComponent(RangeInput, {
		get ["class"]() {
			return classes$2.SettingsItem;
		},
		get placeholder() {
			return helper.t("other.page_range");
		},
		get value() {
			return rangeText();
		},
		onChange: setRangeText
	})];
};
const settingsMap = {
	"manga-image-translator": mitSettings,
	cotrans: cotransSettings
};
const SettingTranslation = () => [solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
	return helper.t("other.enabled");
} }, () => bindOption$1("enabled"))), solid_js_web.createComponent(solid_js.Show, {
	get when() {
		return store.option.translation.enabled;
	},
	get children() {
		return [
			solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
				get name() {
					return helper.t("setting.translation.provider");
				},
				options: [["manga-image-translator", "Manga Image Translator"], ["cotrans", "Cotrans"]]
			}, () => bindOption$1("provider"))),
			solid_js_web.createComponent(solid_js.Show, {
				get when() {
					return allowBatchTranslation();
				},
				get children() {
					return [
						solid_js_web.createComponent(SettingsItemSwitch, {
							get name() {
								return helper.t("setting.translation.translate_all");
							},
							get value() {
								return isTranslatingAll();
							},
							onChange: translateAll
						}),
						solid_js_web.createComponent(SettingsItemSwitch, {
							get name() {
								return helper.t("setting.translation.translate_to_end");
							},
							get value() {
								return isTranslatingToEnd();
							},
							onChange: translateToEnd
						}),
						solid_js_web.createComponent(TranslateRange, {}),
						_tmpl$$6()
					];
				}
			}),
			solid_js_web.createComponent(solid_js_web.Dynamic, { get component() {
				return settingsMap[store.option.translation.provider];
			} }),
			_tmpl$$6(),
			solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
				return helper.t("setting.translation.options.force_retry");
			} }, () => bindOption$1("forceRetry"))),
			solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
				return helper.t("setting.translation.options.only_download_translated");
			} }, () => bindOption$1("onlyDownloadTranslated")))
		];
	}
})];
//#endregion
//#region src/components/Manga/defaultSettingList.tsx
var _tmpl$$5 = /*#__PURE__*/ solid_js_web.template(`<input type=color style=width:2em;margin-right:.4em>`);
var _tmpl$2$2 = /*#__PURE__*/ solid_js_web.template(`<blockquote><p>`);
/** 默认菜单项 */
const defaultSettingList = () => [
	[
		helper.t("setting.option.paragraph_dir"),
		() => solid_js_web.createComponent(SettingsItemButton, {
			get name() {
				return solid_js_web.memo(() => store.option.dir === "rtl")() ? helper.t("setting.option.dir_rtl") : helper.t("setting.option.dir_ltr");
			},
			onClick: switchDir,
			get children() {
				return solid_js_web.memo(() => store.option.dir === "rtl")() ? solid_js_web.createComponent(format_textdirection_r_to_l_default, {}) : solid_js_web.createComponent(format_textdirection_l_to_r_default, {});
			}
		}),
		{ initShow: true }
	],
	[
		helper.t("setting.option.paragraph_display"),
		() => [
			solid_js_web.createComponent(solid_js.Show, {
				get when() {
					return !store.option.scrollMode.enabled;
				},
				get children() {
					return [solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
						return helper.t("setting.option.disable_auto_enlarge");
					} }, () => bindOption("disableZoom"))), solid_js_web.createComponent(SettingsItemNumber, {
						get name() {
							return helper.t("setting.option.zoom");
						},
						maxLength: 3,
						suffix: "%",
						step: 5,
						onChange: (val) => Number.isNaN(val) || zoom(val),
						get value() {
							return Math.round(store.option.zoom.ratio);
						}
					})];
				}
			}),
			solid_js_web.createComponent(solid_js.Show, {
				get when() {
					return store.option.scrollMode.enabled;
				},
				get children() {
					return [
						solid_js_web.createComponent(SettingsItemSwitch, {
							get name() {
								return helper.t("setting.option.abreast_mode");
							},
							get value() {
								return store.option.scrollMode.abreastMode;
							},
							onChange: (val) => {
								const jump = saveScrollProgress();
								setOption((draftOption) => {
									draftOption.scrollMode.abreastMode = val;
									draftOption.scrollMode.doubleMode = false;
								});
								jump();
							}
						}),
						solid_js_web.createComponent(solid_js.Show, {
							get when() {
								return store.option.scrollMode.abreastMode;
							},
							get children() {
								return solid_js_web.createComponent(SettingsItemNumber, {
									get name() {
										return helper.t("setting.option.abreast_duplicate");
									},
									maxLength: 3,
									suffix: "%",
									step: 5,
									onChange: (val) => {
										if (Number.isNaN(val)) return;
										const newVal = helper.clamp(0, val / 100, .95);
										setOption("scrollMode", "abreastDuplicate", newVal);
									},
									get value() {
										return Math.round(store.option.scrollMode.abreastDuplicate * 100);
									}
								});
							}
						}),
						solid_js_web.createComponent(solid_js.Show, {
							get when() {
								return !store.option.scrollMode.abreastMode;
							},
							get children() {
								return [solid_js_web.createComponent(SettingsItemSelect, {
									get name() {
										return helper.t("setting.option.adjust_to_width");
									},
									get options() {
										return [
											["disable", helper.t("other.disable")],
											["full", helper.t("setting.option.full_width")],
											["custom", helper.t("other.custom")]
										];
									},
									get value() {
										return solid_js_web.memo(() => typeof store.option.scrollMode.adjustToWidth === "number")() ? "custom" : store.option.scrollMode.adjustToWidth;
									},
									onChange: (val) => {
										const jump = saveScrollProgress();
										let newVal;
										if (val === "custom") newVal = store.isMobile ? store.rootSize.width : 1280;
										else newVal = val;
										setOption("scrollMode", "adjustToWidth", newVal);
										jump();
									}
								}), solid_js_web.createComponent(solid_js.Show, {
									get when() {
										return isUseAutoScale();
									},
									get children() {
										return solid_js_web.createComponent(SettingsItemNumber, {
											get name() {
												return helper.t("setting.option.adjust_to_width");
											},
											maxLength: 6,
											step: 100,
											onChange: setAdjustToWidth,
											get value() {
												return store.option.scrollMode.adjustToWidth;
											}
										});
									}
								})];
							}
						}),
						solid_js_web.createComponent(solid_js.Show, {
							get when() {
								return store.option.scrollMode.adjustToWidth === "disable";
							},
							get children() {
								return solid_js_web.createComponent(SettingsItemNumber, {
									get name() {
										return helper.t("setting.option.scroll_mode_img_scale");
									},
									maxLength: 3,
									suffix: "%",
									step: 5,
									onChange: (val) => setImgScale(val / 100),
									get value() {
										return Math.round(store.option.scrollMode.imgScale * 100);
									}
								});
							}
						}),
						solid_js_web.createComponent(SettingsItemNumber, {
							get name() {
								return helper.t("setting.option.scroll_mode_img_spacing");
							},
							maxLength: 5,
							onChange: (val) => {
								if (Number.isNaN(val)) return;
								setOption("scrollMode", "spacing", helper.clamp(0, val, Infinity));
							},
							get value() {
								return Math.round(store.option.scrollMode.spacing);
							}
						})
					];
				}
			}),
			solid_js_web.createComponent(SettingsItemSelect, {
				get name() {
					return helper.t("setting.option.page_tip");
				},
				get options() {
					return [
						["hide", helper.t("setting.option.page_tip_hide")],
						["always", helper.t("setting.option.page_tip_always")],
						["auto", helper.t("setting.option.page_tip_auto")]
					];
				},
				get value() {
					return store.option.pageTip;
				},
				onChange: (val) => setOption("pageTip", val)
			}),
			solid_js_web.createComponent(SettingsItemNumber, {
				get name() {
					return helper.t("setting.option.img_filter_brightness");
				},
				maxLength: 3,
				suffix: "%",
				step: 5,
				onChange: (val) => {
					if (Number.isNaN(val)) return;
					setOption("imgFilter", "brightness", helper.clamp(0, val, 200));
				},
				get value() {
					return store.option.imgFilter.brightness;
				}
			}),
			solid_js_web.createComponent(SettingsItemNumber, {
				get name() {
					return helper.t("setting.option.img_filter_contrast");
				},
				maxLength: 3,
				suffix: "%",
				step: 5,
				onChange: (val) => {
					if (Number.isNaN(val)) return;
					setOption("imgFilter", "contrast", helper.clamp(0, val, 200));
				},
				get value() {
					return store.option.imgFilter.contrast;
				}
			}),
			solid_js_web.createComponent(SettingsItemNumber, {
				get name() {
					return helper.t("setting.option.img_filter_saturate");
				},
				maxLength: 3,
				suffix: "%",
				step: 5,
				onChange: (val) => {
					if (Number.isNaN(val)) return;
					setOption("imgFilter", "saturate", helper.clamp(0, val, 200));
				},
				get value() {
					return store.option.imgFilter.saturate;
				}
			}),
			solid_js_web.createComponent(solid_js.Show, {
				get when() {
					return isDoubleMode();
				},
				get children() {
					return solid_js_web.createComponent(SettingsItemNumber, {
						get name() {
							return helper.t("setting.option.page_columns");
						},
						maxLength: 1,
						step: 1,
						onChange: (val) => {
							if (Number.isNaN(val)) return;
							const jump = saveScrollProgress();
							setOption("scrollMode", "pageColumns", helper.clamp(1, val, 6));
							jump();
						},
						get value() {
							return store.option.scrollMode.pageColumns;
						}
					});
				}
			})
		],
		{ initShow: true }
	],
	[
		helper.t("button.scroll_mode"),
		() => [solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.align_edge");
		} }, () => bindOption("scrollMode", "alignEdge"))), solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.scrollbar_easy_scroll");
		} }, () => bindOption("scrollbar", "easyScroll")))],
		{
			initShow: () => isScrollMode(),
			hidden: () => !isScrollMode()
		}
	],
	[helper.t("setting.option.paragraph_appearance"), () => [
		solid_js_web.createComponent(SettingsItemSelect, {
			get name() {
				return helper.t("setting.option.dark_mode");
			},
			get options() {
				return [
					["site", helper.t("setting.option.dark_mode_site")],
					["light", helper.t("setting.option.dark_mode_light")],
					["dark", helper.t("setting.option.dark_mode_dark")]
				];
			},
			get value() {
				if (store.option.darkMode === void 0) return "site";
				return store.option.darkMode ? "dark" : "light";
			},
			onChange: (val) => setOption("darkMode", val === "site" ? void 0 : val === "dark")
		}),
		solid_js_web.createComponent(SettingsItemNumber, {
			get name() {
				return helper.t("setting.option.turn_page_animation_duration");
			},
			maxLength: 4,
			suffix: "ms",
			step: 50,
			onChange: (val) => {
				if (Number.isNaN(val)) return;
				setOption("turnPageDuration", helper.clamp(0, val, 2e3));
			},
			get value() {
				return store.option.turnPageDuration;
			}
		}),
		solid_js_web.createComponent(SettingsItemNumber, {
			get name() {
				return helper.t("setting.option.scroll_animation_duration");
			},
			maxLength: 4,
			suffix: "ms",
			step: 50,
			onChange: (val) => {
				if (Number.isNaN(val)) return;
				setOption("scrollDuration", helper.clamp(0, val, 2e3));
			},
			get value() {
				return store.option.scrollDuration;
			}
		}),
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.show_comments");
		} }, () => bindOption("showComment"))),
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.auto_hidden_mouse");
		} }, () => bindOption("autoHiddenMouse"))),
		solid_js_web.createComponent(SettingsItem, {
			get name() {
				return helper.t("setting.option.background_color");
			},
			get children() {
				var _el$ = _tmpl$$5();
				solid_js_web.addEventListener(_el$, "input", helper.throttle((e) => {
					if (!e.target.value) return;
					setOption((draftOption) => {
						draftOption.customBackground = e.target.value === "#000000" || e.target.value === "#ffffff" ? void 0 : e.target.value;
						if (draftOption.customBackground) draftOption.darkMode = helper.needDarkMode(draftOption.customBackground);
					});
				}, 20));
				solid_js_web.effect(() => _el$.value = store.option.customBackground ?? (helper.effectiveDark() ? "#000000" : "#ffffff"));
				return _el$;
			}
		}),
		solid_js_web.createComponent(SettingsItemSelect, {
			get name() {
				return helper.t("setting.language");
			},
			options: [
				["zh", "中文"],
				["en", "English"],
				["ru", "Русский"]
			],
			get value() {
				return helper.lang();
			},
			onChange: helper.setLang
		})
	]],
	[helper.t("setting.option.paragraph_scrollbar"), () => [solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
		get name() {
			return helper.t("setting.option.scrollbar_position");
		},
		get options() {
			return [
				["auto", helper.t("other.auto")],
				["right", helper.t("setting.option.scrollbar_position_right")],
				["top", helper.t("setting.option.scrollbar_position_top")],
				["bottom", helper.t("setting.option.scrollbar_position_bottom")],
				["hidden", helper.t("setting.option.scrollbar_position_hidden")]
			];
		}
	}, () => bindOption("scrollbar", "position"))), solid_js_web.createComponent(SettingsShowItem, {
		get when() {
			return store.option.scrollbar.position !== "hidden";
		},
		get children() {
			return [solid_js_web.createComponent(solid_js.Show, {
				get when() {
					return !store.isMobile;
				},
				get children() {
					return solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
						return helper.t("setting.option.scrollbar_auto_hidden");
					} }, () => bindOption("scrollbar", "autoHidden")));
				}
			}), solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
				return helper.t("setting.option.scrollbar_show_img_status");
			} }, () => bindOption("scrollbar", "showImgStatus")))];
		}
	})]],
	[helper.t("setting.option.click_page_turn_enabled"), () => [
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("other.enabled");
		} }, () => bindOption("clickPageTurn", "enabled"))),
		solid_js_web.createComponent(SettingsItemSwitch, {
			get name() {
				return helper.t("setting.option.show_clickable_area");
			},
			get value() {
				return store.show.touchArea;
			},
			onChange: () => setState("show", "touchArea", !store.show.touchArea)
		}),
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.shrink_menu");
		} }, () => bindOption("clickPageTurn", "shrinkMenu"))),
		solid_js_web.createComponent(SettingsShowItem, {
			get when() {
				return store.option.clickPageTurn.enabled;
			},
			get children() {
				return [solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
					get name() {
						return helper.t("setting.option.click_page_turn_area");
					},
					get options() {
						return Object.keys(areaArrayMap).map((key) => [key, helper.t(`touch_area.type.${key}`)]);
					}
				}, () => bindOption("clickPageTurn", "area"))), solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
					return helper.t("setting.option.click_page_turn_swap_area");
				} }, () => bindOption("clickPageTurn", "reverse")))];
			}
		})
	]],
	[helper.t("button.auto_scroll"), () => [
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("other.enabled");
		} }, () => bindOption("autoScroll", "enabled"))),
		solid_js_web.createComponent(SettingsItemNumber, {
			name: "滚动速度",
			maxLength: 12,
			suffix: "px/10ms",
			step: 0.05,
			onChange: (val) => {
				if (!Number.isFinite(val) || val <= 0) return;
				// Blurring an unchanged, rounded display must not alter a saved speed.
				if (val === Number((autoScrollSpeed() * 10).toPrecision(8))) return;
				setOption((option) => {
					option.autoScroll.interval = 10;
					option.autoScroll.distance = val;
				});
			},
			get value() {
				return Number((autoScrollSpeed() * 10).toPrecision(8));
			}
		}),
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.auto_scroll_trigger_end");
		} }, () => bindOption("autoScroll", "triggerEnd")))
	]],
	[helper.t("setting.option.img_recognition"), () => [
		solid_js_web.createComponent(SettingsItemSwitch, {
			get name() {
				return helper.t("other.enabled");
			},
			get value() {
				return store.option.imgRecognition.enabled;
			},
			onChange: () => switchImgRecognition("enabled")
		}),
		solid_js_web.createComponent(solid_js.Show, {
			when: typeof Worker === "undefined",
			get children() {
				var _el$2 = _tmpl$2$2(), _el$3 = _el$2.firstChild;
				solid_js_web.effect(() => _el$3.innerHTML = helper.t("setting.option.img_recognition_warn"));
				return _el$2;
			}
		}),
		solid_js_web.createComponent(solid_js.Show, {
			when: !userscript_supportWorker.supportWorker,
			get children() {
				var _el$4 = _tmpl$2$2(), _el$5 = _el$4.firstChild;
				solid_js_web.effect(() => _el$5.innerHTML = helper.t("setting.option.img_recognition_warn_2"));
				return _el$4;
			}
		}),
		solid_js_web.createComponent(SettingsItemSwitch, {
			get name() {
				return helper.t("setting.option.img_recognition_background");
			},
			get disabled() {
				return !store.option.imgRecognition.enabled;
			},
			get value() {
				return store.option.imgRecognition.background;
			},
			onChange: () => switchImgRecognition("background")
		}),
		solid_js_web.createComponent(SettingsItemSwitch, {
			get name() {
				return helper.t("setting.option.img_recognition_pageFill");
			},
			get disabled() {
				return !store.option.imgRecognition.enabled;
			},
			get value() {
				return store.option.imgRecognition.pageFill;
			},
			onChange: () => switchImgRecognition("pageFill")
		}),
		solid_js_web.createComponent(SettingsItemSwitch, {
			get name() {
				return helper.t("setting.option.img_recognition_crop");
			},
			get disabled() {
				return !store.option.imgRecognition.enabled;
			},
			get value() {
				return store.option.imgRecognition.crop;
			},
			onChange: () => switchImgRecognition("crop")
		}),
		solid_js_web.createComponent(SettingsItemNumber, {
			get name() {
				return helper.t("setting.option.img_recognition_keepMargin");
			},
			get disabled() {
				return !store.option.imgRecognition.enabled;
			},
			maxLength: 4,
			suffix: "px",
			step: 1,
			onChange: (val) => setOption("imgRecognition", "keepMargin", Math.max(0, Math.round(val))),
			get value() {
				return store.option.imgRecognition.keepMargin;
			}
		}),
		solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return !store.isMobile;
			},
			get children() {
				return solid_js_web.createComponent(SettingsItemSwitch, {
					get name() {
						return helper.t("upscale.title");
					},
					get disabled() {
						return !store.option.imgRecognition.enabled || !store.supportUpscaleImage;
					},
					get value() {
						return store.option.imgRecognition.upscale;
					},
					onChange: () => switchImgRecognition("upscale")
				});
			}
		})
	]],
	[helper.t("setting.option.paragraph_translation"), SettingTranslation],
	[helper.t("other.hotkeys"), SettingHotkeysBlock],
	[helper.t("other.other"), () => [
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.first_page_fill");
		} }, () => bindOption("firstPageFill"))),
		solid_js_web.createComponent(SettingsItemSwitch, {
			get name() {
				return helper.t("setting.option.auto_switch_page_mode");
			},
			get value() {
				return store.option.autoSwitchPageMode;
			},
			onChange: (val) => {
				setOption((draftOption, state) => {
					draftOption.autoSwitchPageMode = val;
					state.option.pageNum = val ? 0 : autoPageNum();
				});
			}
		}),
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.swap_page_turn_key");
		} }, () => bindOption("swapPageTurnKey"))),
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.auto_fullscreen");
		} }, () => bindOption("autoFullscreen"))),
		solid_js_web.createComponent(SettingsItemSelect, solid_js_web.mergeProps({
			get name() {
				return helper.t("setting.option.scroll_end");
			},
			get options() {
				return [
					["none", helper.t("other.none")],
					["exit", helper.t("other.exit")],
					["auto", helper.t("setting.option.scroll_end_auto")]
				];
			}
		}, () => bindOption("scroolEnd"))),
		solid_js_web.createComponent(SettingsItemSwitch, solid_js_web.mergeProps({ get name() {
			return helper.t("setting.option.always_load_all_img");
		} }, () => bindOption("alwaysLoadAllImg"))),
		solid_js_web.createComponent(SettingsItemNumber, {
			get name() {
				return helper.t("setting.option.preload_page_num");
			},
			maxLength: 5,
			onChange: (val) => {
				if (Number.isNaN(val)) return;
				setOption("preloadPageNum", helper.clamp(0, val, 99999));
			},
			get value() {
				return store.option.preloadPageNum;
			}
		})
	]]
];
//#endregion
//#region src/components/Manga/components/SettingPanel.tsx
var _tmpl$$4 = /*#__PURE__*/ solid_js_web.template(`<div>`);
var _tmpl$2$1 = /*#__PURE__*/ solid_js_web.template(`<div><div>`);
var _tmpl$3 = /*#__PURE__*/ solid_js_web.template(`<hr>`);
const SettingBlockSubtitle = (props) => (() => {
	var _el$ = _tmpl$$4();
	solid_js_web.addEventListener(_el$, "click", props.onClick);
	solid_js_web.insert(_el$, () => props.children);
	solid_js_web.effect(() => solid_js_web.className(_el$, classes$2.SettingBlockSubtitle));
	return _el$;
})();
/** 侧边面板通用容器 */
const SettingPanelContainer = (props) => {
	let panelRef;
	return (() => {
		var _el$2 = _tmpl$$4();
		solid_js_web.addEventListener(_el$2, "click", stopPropagation);
		solid_js_web.addEventListener(_el$2, "scroll", stopPropagation);
		_el$2.addEventListener("wheel", (e) => panelRef.scrollHeight > panelRef.clientHeight && e.stopPropagation());
		solid_js_web.use((e) => {
			panelRef = e;
			if (typeof props.ref === "function") props.ref(e);
		}, _el$2);
		solid_js_web.insert(_el$2, () => props.children);
		solid_js_web.effect((_p$) => {
			var _v$ = [
				classes$2.SettingPanel,
				classes$2.beautifyScrollbar,
				props.class
			].join(" "), _v$2 = props.style;
			_v$ !== _p$.e && solid_js_web.className(_el$2, _p$.e = _v$);
			_p$.t = solid_js_web.style(_el$2, _v$2, _p$.t);
			return _p$;
		}, {
			e: void 0,
			t: void 0
		});
		return _el$2;
	})();
};
/** 设置菜单面板 */
const SettingPanel = () => solid_js_web.createComponent(SettingPanelContainer, {
	ref(r$) {
		var _ref$ = bindRef("settingPanel");
		typeof _ref$ === "function" && _ref$(r$);
	},
	get style() {
		return { width: helper.lang() === "zh" ? "15em" : "20em" };
	},
	get children() {
		return solid_js_web.createComponent(solid_js.For, {
			get each() {
				return store.prop.editSettingList(defaultSettingList());
			},
			children: ([name, SettingItem, options], i) => {
				const initShow = options?.initShow;
				const [show, setShwo] = solid_js.createSignal(Boolean(initShow));
				if (typeof initShow === "function") helper.createEffectOn(initShow, (val) => setShwo(val));
				return solid_js_web.createComponent(solid_js.Show, {
					get when() {
						return solid_js_web.memo(() => !!options?.hidden)() ? !options.hidden() : true;
					},
					get children() {
						return [solid_js_web.memo(() => solid_js_web.memo(() => !!i())() ? _tmpl$3() : null), (() => {
							var _el$3 = _tmpl$2$1(), _el$4 = _el$3.firstChild;
							solid_js_web.insert(_el$3, solid_js_web.createComponent(SettingBlockSubtitle, {
								onClick: () => setShwo((prev) => !prev),
								get children() {
									return [name, solid_js_web.memo(() => show() ? null : "…")];
								}
							}), _el$4);
							solid_js_web.insert(_el$4, solid_js_web.createComponent(SettingItem, {}));
							solid_js_web.effect((_p$) => {
								var _v$3 = classes$2.SettingBlock, _v$4 = show(), _v$5 = classes$2.SettingBlockBody;
								_v$3 !== _p$.e && solid_js_web.className(_el$3, _p$.e = _v$3);
								_v$4 !== _p$.t && solid_js_web.setAttribute(_el$3, "data-show", _p$.t = _v$4);
								_v$5 !== _p$.a && solid_js_web.className(_el$4, _p$.a = _v$5);
								return _p$;
							}, {
								e: void 0,
								t: void 0,
								a: void 0
							});
							return _el$3;
						})()];
					}
				});
			}
		});
	}
});
//#endregion
//#region src/components/Manga/defaultButtonList.tsx
var _tmpl$$3 = /*#__PURE__*/ solid_js_web.template(`<div role=button tabindex=-1>`);
var _tmpl$2 = /*#__PURE__*/ solid_js_web.template(`<hr>`);
const ZoomButton = () => solid_js_web.createComponent(IconButton$1, {
	get tip() {
		return solid_js_web.memo(() => store.option.zoom.ratio === 100)() ? helper.t("button.zoom_in") : helper.t("button.zoom_out");
	},
	get enabled() {
		return store.option.zoom.ratio !== 100;
	},
	onClick: () => doubleClickZoom(),
	get children() {
		return solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return store.option.zoom.ratio === 100;
			},
			get fallback() {
				return solid_js_web.createComponent(zoom_out_default, {});
			},
			get children() {
				return solid_js_web.createComponent(zoom_in_default, {});
			}
		});
	}
});
/** 设置按钮 */
const SettingButton = () => {
	const [showPanel, setShowPanel] = solid_js.createSignal(false);
	const handleClick = () => {
		const newVal = !showPanel();
		setState("show", "toolbar", newVal);
		setShowPanel(newVal);
	};
	helper.createEffectOn(() => store.show.toolbar, (showToolbar) => showToolbar || setShowPanel(false));
	const Popper = solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return showPanel();
		},
		get children() {
			return [solid_js_web.createComponent(SettingPanel, {}), (() => {
				var _el$ = _tmpl$$3();
				_el$.addEventListener("wheel", (e) => {
					if (isScrollMode()) refs.mangaBox.scrollBy({ top: e.deltaY });
				});
				solid_js_web.addEventListener(_el$, "click", handleClick);
				solid_js_web.effect(() => solid_js_web.className(_el$, classes$2.closeCover));
				return _el$;
			})()];
		}
	});
	return solid_js_web.createComponent(IconButton$1, {
		get tip() {
			return helper.t("other.setting");
		},
		get enabled() {
			return showPanel();
		},
		get showTip() {
			return showPanel();
		},
		onClick: handleClick,
		get popperClassName() {
			return solid_js_web.memo(() => !!showPanel())() && classes$2.SettingPanelPopper;
		},
		get popper() {
			return showPanel() && Popper;
		},
		get children() {
			return solid_js_web.createComponent(settings_default, {});
		}
	});
};
/** 工具栏的默认按钮列表 */
const defaultButtonList = [
	() => solid_js_web.createComponent(IconButton$1, {
		get tip() {
			return solid_js_web.memo(() => !!isOnePageMode())() ? helper.t("button.page_mode_single") : helper.t("button.page_mode_double");
		},
		get hidden() {
			return store.isMobile;
		},
		onClick: switchOnePageMode,
		get children() {
			return solid_js_web.memo(() => !!isOnePageMode())() ? solid_js_web.createComponent(looks_one_default, {}) : solid_js_web.createComponent(looks_two_default, {});
		}
	}),
	() => solid_js_web.createComponent(IconButton$1, {
		get tip() {
			return helper.t("button.scroll_mode");
		},
		get enabled() {
			return store.option.scrollMode.enabled;
		},
		onClick: switchScrollMode,
		get children() {
			return solid_js_web.createComponent(view_day_default, {});
		}
	}),
	() => solid_js_web.createComponent(IconButton$1, {
		get tip() {
			return helper.t("button.page_fill");
		},
		get enabled() {
			return Boolean(store.fillEffect[nowFillIndex()]);
		},
		get hidden() {
			return isOnePageMode();
		},
		onClick: switchFillEffect,
		get children() {
			return solid_js_web.createComponent(queue_default, {});
		}
	}),
	() => solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return store.option.translation.enabled;
		},
		get children() {
			return [
				_tmpl$2(),
				solid_js_web.createComponent(IconButton$1, {
					get tip() {
						return solid_js_web.memo(() => !!isTranslatingImage())() ? helper.t("button.close_current_page_translation") : helper.t("button.translate_current_page");
					},
					get enabled() {
						return isTranslatingImage();
					},
					onClick: translateCurrent,
					get children() {
						return solid_js_web.createComponent(translate_default, {});
					}
				}),
				solid_js_web.createComponent(IconButton$1, {
					get tip() {
						return helper.t("setting.translation.translate_to_end");
					},
					get enabled() {
						return isTranslatingToEnd();
					},
					get hidden() {
						return !allowBatchTranslation();
					},
					onClick: translateToEnd,
					get children() {
						return solid_js_web.createComponent(low_priority_default, {});
					}
				})
			];
		}
	}),
	() => solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return store.option.autoScroll.enabled;
		},
		get children() {
			return [_tmpl$2(), solid_js_web.createComponent(AutoScrollButton, {})];
		}
	}),
	() => _tmpl$2(),
	() => [solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return !store.option.scrollMode.enabled;
		},
		get children() {
			return solid_js_web.createComponent(ZoomButton, {});
		}
	}), solid_js_web.createComponent(solid_js.Show, {
		get when() {
			return solid_js_web.memo(() => !!store.option.scrollMode.enabled)() && store.option.scrollMode.adjustToWidth !== "full";
		},
		get children() {
			return [solid_js_web.createComponent(IconButton$1, {
				get tip() {
					return helper.t("button.zoom_in");
				},
				get enabled() {
					return store.option.scrollMode.imgScale >= 3;
				},
				onClick: () => handleScrollModeZoom("add"),
				get children() {
					return solid_js_web.createComponent(zoom_in_default, {});
				}
			}), solid_js_web.createComponent(IconButton$1, {
				get tip() {
					return helper.t("button.zoom_out");
				},
				get enabled() {
					return store.option.scrollMode.imgScale <= .1;
				},
				onClick: () => handleScrollModeZoom("sub"),
				get children() {
					return solid_js_web.createComponent(zoom_out_default, {});
				}
			})];
		}
	})],
	() => solid_js_web.createComponent(IconButton$1, {
		get tip() {
			return solid_js_web.memo(() => !!store.fullscreen)() ? helper.t("button.fullscreen_exit") : helper.t("button.fullscreen");
		},
		get hidden() {
			return !refs.root.requestFullscreen;
		},
		onClick: switchFullscreen,
		get children() {
			return solid_js_web.memo(() => !!store.fullscreen)() ? solid_js_web.createComponent(fullscreen_exit_default, {}) : solid_js_web.createComponent(fullscreen_default, {});
		}
	}),
	DownloadButton,
	SettingButton,
	() => _tmpl$2(),
	() => solid_js_web.createComponent(IconButton$1, {
		get tip() {
			return helper.t("other.exit");
		},
		onClick: () => store.prop.onExit?.(),
		get children() {
			return solid_js_web.createComponent(close_default, {});
		}
	})
];
//#endregion
//#region src/components/Manga/components/Toolbar.tsx
var _tmpl$$2 = /*#__PURE__*/ solid_js_web.template(`<div role=toolbar><div><div>`);
/** 左侧工具栏 */
const Toolbar = () => {
	helper.createEffectOn(() => store.show.toolbar, (show) => show || focus());
	return (() => {
		var _el$ = _tmpl$$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild;
		solid_js_web.effect(() => solid_js_web.setStyleProperty(_el$, "display", store.autoScroll.play && !store.show.toolbar ? "none" : void 0));
		solid_js_web.addEventListener(_el$2, "click", focus);
		solid_js_web.insert(_el$2, solid_js_web.createComponent(solid_js.For, {
			get each() {
				return store.prop.editButtonList(defaultButtonList);
			},
			children: (ButtonItem) => solid_js_web.createComponent(ButtonItem, {})
		}), null);
		solid_js_web.effect((_p$) => {
			var _v$ = classes$2.toolbar, _v$2 = helper.boolDataVal(store.show.toolbar), _v$3 = store.isDragMode ? "none" : void 0, _v$4 = classes$2.toolbarPanel, _v$5 = classes$2.toolbarBg;
			_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "data-show", _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setStyleProperty(_el$, "pointer-events", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.className(_el$2, _p$.o = _v$4);
			_v$5 !== _p$.i && solid_js_web.className(_el$3, _p$.i = _v$5);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0,
			i: void 0
		});
		return _el$;
	})();
};
//#endregion
//#region src/components/Manga/components/WheelProgress.module.css
const classes = { "wheelProgress": "wheelProgress___bFAqF" };
//#endregion
//#region src/components/Manga/components/WheelProgress.tsx
var _tmpl$$1 = /*#__PURE__*/ solid_js_web.template(`<div>`);
/** 虚拟棘轮翻页进度指示线：滚动时显示，长度反映距翻页还差多少，方向与滚动方向一致 */
const WheelProgress = () => {
	css$1(`.${classes.wheelProgress}`, {
		opacity: () => {
			switch (store.scrollDeviceType) {
				case void 0:
				case "a": return 0;
				default: return store.wheelProgress === 0 ? 0 : 1;
			}
		},
		"--wheel-progress": () => `${Math.abs(store.wheelProgress)}`
	});
	return (() => {
		var _el$ = _tmpl$$1();
		solid_js_web.effect((_p$) => {
			var _v$ = classes.wheelProgress, _v$2 = scrollPosition(), _v$3 = store.option.dir, _v$4 = helper.boolDataVal(store.wheelProgress > 0);
			_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
			_v$2 !== _p$.t && solid_js_web.setAttribute(_el$, "data-position", _p$.t = _v$2);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "data-dir", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$, "data-down", _p$.o = _v$4);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0
		});
		return _el$;
	})();
};
//#endregion
//#region src/components/Manga/hooks/useCssVar.ts
/** 主题颜色，通过 light-dark() 配合 color-scheme 自动选择深浅色 */
const themeStyle = {
	"--hover-bg-color": "light-dark(#0001, #FFF3)",
	"--hover-bg-color-enable": "light-dark(#0009, #FFFa)",
	"--switch": "light-dark(#FAFAFA, #BDBDBD)",
	"--switch-bg": "light-dark(#9C9C9C, #6E6E6E)",
	"--page-bg": "light-dark(white, #303030)",
	"--secondary": "#7A909A",
	"--secondary-bg": "light-dark(#BAC5CA, #556065)",
	"--text": "light-dark(black, white)",
	"--text-secondary": "light-dark(#0008, #FFFC)",
	"--text-bg": "light-dark(#FAFAFA, #121212)"
};
const createSvgIcon = (fill, d) => `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='${fill}' viewBox='0 0 24 24'%3E%3Cpath d='${d}'/%3E%3C/svg%3E")`;
const MdImageNotSupported = `m21.9 21.9-8.49-8.49-9.82-9.82L2.1 2.1.69 3.51 3 5.83V19c0 1.1.9 2 2 2h13.17l2.31 2.31 1.42-1.41zM5 18l3.5-4.5 2.5 3.01L12.17 15l3 3H5zm16 .17L5.83 3H19c1.1 0 2 .9 2 2v13.17z`;
const MdCloudDownload = `M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-4.65 4.65c-.2.2-.51.2-.71 0L7 13h3V9h4v4h3z`;
const MdPhoto = `M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14z`;
/** 根据当前图片滤镜选项生成 filter 值，隐藏值为 100 的滤镜 */
const getImgFilter = () => {
	const { brightness, contrast, saturate } = store.option.imgFilter;
	const list = [
		brightness !== 100 && `brightness(${brightness}%)`,
		contrast !== 100 && `contrast(${contrast}%)`,
		saturate !== 100 && `saturate(${saturate}%)`
	].filter(Boolean);
	if (list.length > 0) return list.join(" ");
};
const useCssVar = () => {
	const svg = () => {
		const fill = helper.effectiveDark() ? "rgb(156,156,156)" : "rgb(110,110,110)";
		return {
			"--md-image-not-supported": createSvgIcon(fill, MdImageNotSupported),
			"--md-cloud-download": createSvgIcon(fill, MdCloudDownload),
			"--md-photo": createSvgIcon(fill, MdPhoto)
		};
	};
	const i18n = () => ({
		"--i18n-touch-area-prev": `"${helper.t("hotkeys.page_up")}"`,
		"--i18n-touch-area-next": `"${helper.t("hotkeys.page_down")}"`,
		"--i18n-touch-area-menu": `"${helper.t("touch_area.menu")}"`
	});
	css$1(`.${classes$2.root}`, [
		{
			"--bg": () => store.option.customBackground ?? (helper.effectiveDark() ? "#000" : "#fff"),
			"--scroll-mode-spacing": () => store.option.scrollMode.spacing,
			"color-scheme": () => helper.effectiveDark() ? "dark" : "light",
			"--img-filter": getImgFilter
		},
		() => themeStyle,
		svg,
		i18n
	]);
};
//#endregion
//#region src/components/Manga/hooks/useInit.ts
const useInit = (props) => {
	watchDomSize("rootSize", refs.root);
	const updateOption = (state) => {
		state.defaultOption = helper.assign(defaultOption(), props.defaultOption ?? {});
		state.option = helper.assign(state.defaultOption, props.option ?? {});
	};
	const bindProp = (key, defaultValue) => (state) => Reflect.set(state.prop, key, props[key] ?? defaultValue);
	const bindDebounce = (key) => (state) => {
		state.prop[key] = props[key] ? helper.debounce(props[key]) : void 0;
	};
	const watchProps = {
		option: updateOption,
		onLoading: bindDebounce("onLoading"),
		onOptionChange: bindDebounce("onOptionChange"),
		onHotkeysChange: bindDebounce("onHotkeysChange"),
		onShowImgsChange: bindDebounce("onShowImgsChange"),
		defaultOption(state) {
			updateOption(state);
		},
		fillEffect(state) {
			state.fillEffect = props.fillEffect ?? { "-1": true };
			updatePageData(state);
		},
		onExit(state) {
			state.prop.onExit = (isEnd) => {
				playAnimation(refs.exit);
				props.onExit?.(Boolean(isEnd));
				setState((draftState) => {
					if (isEnd) draftState.activePageIndex = 0;
					draftState.show.endPage = void 0;
				});
				if (document.fullscreenElement) document.exitFullscreen();
			};
		},
		onPrev(state) {
			state.prop.onPrev = props.onPrev ? helper.throttle(() => {
				playAnimation(refs.prev);
				props.onPrev?.();
			}, 1e3) : void 0;
		},
		onNext(state) {
			state.prop.onNext = props.onNext ? helper.throttle(() => {
				playAnimation(refs.next);
				props.onNext?.();
			}, 1e3) : void 0;
		},
		onImgError: bindProp("onImgError"),
		onWaitUrlImgs: bindProp("onWaitUrlImgs"),
		editButtonList: bindProp("editButtonList", (list) => list),
		editSettingList: bindProp("editSettingList", (list) => list),
		commentList(state) {
			state.commentList = props.commentList;
		},
		title(state) {
			state.title = props.title ?? "";
		}
	};
	for (const [key, fn] of Object.entries(watchProps)) solid_js.createEffect(solid_js.on(() => props[key], () => setState(fn)));
	solid_js.createEffect(() => {
		setState((state) => {
			state.hotkeys = {
				...structuredClone(defaultHotkeys()),
				...props.hotkeys
			};
		});
	});
	solid_js.createEffect(() => helper.setManualDark(props.show === false ? void 0 : store.option.darkMode));
	const handleImgList = () => {
		setState((state) => {
			const newImgMap = {};
			const newImgList = [];
			for (const img of solid_js_store.unwrap(props.imgList)) {
				const url = (typeof img === "object" ? img.src : img)?.replace(/^http:/u, "") ?? "";
				newImgList.push(url);
				if (Reflect.has(newImgMap, url)) continue;
				if (Reflect.has(state.imgMap, url)) {
					newImgMap[url] = state.imgMap[url];
					continue;
				}
				const imgItem = typeof img === "string" ? { src: url } : img;
				imgItem.loadType ??= "wait";
				if (imgItem.width && imgItem.height) imgItem.type = getImgType(imgItem);
				imgItem.size = getImgDisplaySize(state, imgItem);
				if (!imgItem.blobUrl && url.startsWith("blob:")) imgItem.blobUrl = imgItem.src;
				newImgMap[url] = imgItem;
			}
			/** 修改前的当前显示图片 */
			const oldActiveImg = state.pageList[state.activePageIndex]?.map((i) => state.imgList?.[i]) ?? [];
			/** 是否需要重置页面填充 */
			let needResetFillEffect = false;
			const fillEffectList = Object.keys(state.fillEffect).map(Number);
			for (const pageIndex of fillEffectList) {
				if (pageIndex === -1) continue;
				if (state.imgList[pageIndex] === newImgList[pageIndex]) continue;
				needResetFillEffect = true;
				break;
			}
			const oldImgSet = new Set(state.imgList);
			const newImgSet = new Set(newImgList);
			if (oldImgSet.size === 0 && newImgList.length > 0 && state.option.translation.enabled) updateMitTranslators(true);
			/** 被删除的图片 */
			const deleteList = oldImgSet.difference(newImgSet);
			for (const url of deleteList) if (state.imgMap[url].blobUrl && state.imgMap[url].blobUrl !== url) URL.revokeObjectURL(state.imgMap[url].blobUrl);
			/** 删除图片数 */
			const deleteNum = deleteList.size;
			/** 传入的是否是新漫画 */
			const isNew = deleteNum >= oldImgSet.size * .8;
			/** 是否需要更新页面 */
			const needUpdatePageData = needResetFillEffect || state.imgList.length !== newImgList.length || deleteNum > 0;
			state.imgMap = newImgMap;
			state.imgList = [...newImgList];
			state.prop.onLoading?.(state.imgList.map((url) => state.imgMap[url]));
			if (isNew) state.show.endPage = void 0;
			if (isNew || needResetFillEffect) state.fillEffect = props.fillEffect ?? { "-1": true };
			if (isNew || needUpdatePageData) {
				updatePageData(state);
				if (state.activePageIndex >= state.pageList.length) state.activePageIndex = state.pageList.length - 1;
				updateShowRange(state);
			}
			syncImgLoadState(state);
			if (isNew || state.pageList.length === 0) {
				resetImgState(state);
				state.activePageIndex = 0;
				scrollTo(0);
				const { initialImgIndex } = props;
				if (helper.isSafeInteger(initialImgIndex) && state.imgList.length > 1) {
					const index = helper.clamp(0, initialImgIndex, state.imgList.length - 1);
					if (state.option.scrollMode.enabled) return setTimeout(scrollViewImg, 500, index);
					jumpToImg(index);
				}
				return;
			}
			oldActiveImg.some((url) => {
				if (!url || newImgSet.has(url)) return false;
				const newPageIndex = state.pageList.findIndex((page) => page.some((index) => state.imgList?.[index] === url));
				if (newPageIndex === -1) return false;
				state.activePageIndex = newPageIndex;
				return true;
			});
			if (state.activePageIndex > state.pageList.length - 1) state.activePageIndex = state.pageList.length - 1;
		});
	};
	helper.createEffectOn(helper.createRootMemo(() => props.imgList), helper.throttle(handleImgList, 500));
	refs.root.addEventListener("fullscreenchange", () => {
		if (!document.fullscreenElement) return setState("fullscreen", false);
		if (document.fullscreenElement.id === "comicRead" || document.fullscreenElement.classList.contains(classes$2.root)) setState("fullscreen", true);
	});
	for (const eventName of [
		"keypress",
		"keyup",
		"touchstart",
		"touchmove",
		"touchend"
	]) refs.root.addEventListener(eventName, stopPropagation, { capture: true });
	focus();
};
//#endregion
//#region src/components/Manga/index.module.css?inline
var index_module_default = ".img___7ajV4 img {\n  display: block;\n\n  width: 100%;\n  height: 100%;\n\n  object-fit: contain;\n  filter: var(--img-filter, none);\n}\n\n.img___7ajV4 {\n  position: relative;\n\n  align-content: center;\n\n  width: 100%;\n  height: 100%;\n  margin-right: auto;\n  margin-left: auto;\n}\n\n.img___7ajV4 > picture {\n    position: absolute;\n    inset: 0;\n\n    width: auto;\n    max-width: 100%;\n    height: auto;\n    max-height: 100%;\n    margin-top: auto;\n    margin-right: inherit;\n    margin-bottom: auto;\n    margin-left: inherit;\n  }\n\n.img___7ajV4 > picture,.img___7ajV4 > picture::after {\n    background-color: var(--hover-bg-color, #fff3);\n    background-image: var(--md-photo);\n    background-repeat: no-repeat;\n    background-position: center;\n    background-size: 30%;\n  }\n\n/* 已加载完毕的图片不显示灰色背景和图标 */\n\n.img___7ajV4:not([data-load-type]) > picture,.img___7ajV4:not([data-load-type]) > picture::after {\n    background: none;\n  }\n\n/* 遮住默认的出错图片标识 */\n\n.img___7ajV4[data-load-type='error'] > picture::after {\n    pointer-events: none;\n    content: '';\n\n    position: absolute;\n    top: 0;\n    right: 0;\n\n    width: 100%;\n    height: 100%;\n\n    background-color: #eee;\n    background-image: var(--md-image-not-supported);\n  }\n\n.img___7ajV4[data-load-type='loading'] > picture {\n    background-image: var(--md-cloud-download);\n\n    /* 加载中的图片先隐藏一下，避免出错图片的元素被直接显示出来 */\n  }\n\n:is(.img___7ajV4[data-load-type='loading'] > picture) img {\n      animation: show___HzwUa 100ms forwards;\n    }\n\n.img___7ajV4[data-load-type='error'] > picture {\n    cursor: pointer;\n  }\n\n.mangaFlow___jMZgq[dir='ltr'] .img___7ajV4[data-show='1'],\n.mangaFlow___jMZgq[dir='rtl'] .img___7ajV4[data-show='0'] {\n  margin-right: auto;\n  margin-left: 0;\n}\n\n.mangaFlow___jMZgq[dir='ltr'] .img___7ajV4[data-show='0'],\n.mangaFlow___jMZgq[dir='rtl'] .img___7ajV4[data-show='1'] {\n  margin-right: 0;\n  margin-left: auto;\n}\n\n.mangaFlow___jMZgq {\n  touch-action: none;\n  will-change: left, top;\n  -webkit-user-select: none;\n          user-select: none;\n\n  position: absolute;\n  transform-origin: 0 0;\n\n  contain: layout;\n  overflow: visible;\n  display: grid;\n  grid-auto-columns: 100%;\n  grid-auto-flow: column;\n  grid-auto-rows: 100%;\n  row-gap: 0;\n  place-items: center;\n\n  width: 100%;\n  height: 100%;\n\n  color: var(--text);\n\n  backface-visibility: hidden;\n}\n\n.mangaFlow___jMZgq[data-disable-zoom] .img___7ajV4 > picture {\n    width: fit-content;\n    height: fit-content;\n  }\n\n.mangaFlow___jMZgq[data-hidden-mouse='true'] {\n    cursor: none;\n  }\n\n.mangaFlow___jMZgq[data-vertical] {\n    grid-auto-flow: row;\n  }\n\n.mangaBox___48Jek {\n  transform-origin: 0 0;\n\n  contain: layout style;\n\n  width: 100%;\n  height: 100%;\n\n  transition-duration: 0ms;\n}\n\n.mangaBox___48Jek[data-animation='page'] .mangaFlow___jMZgq,.mangaBox___48Jek[data-animation='zoom'] {\n    transition-duration: 300ms;\n  }\n\n.root___Hf5H2 .mangaBox___48Jek {\n  /* 隐藏滚动条但不影响滚动 */\n  scrollbar-width: none;\n\n  /* 隐藏滚动条但不影响滚动 */\n}\n\n:is(.root___Hf5H2 .mangaBox___48Jek)::-webkit-scrollbar {\n    display: none;\n  }\n\n.root___Hf5H2[data-scroll-mode] .mangaBox___48Jek {\n  overflow: auto;\n}\n\n:is(.root___Hf5H2[data-scroll-mode] .mangaBox___48Jek) .mangaFlow___jMZgq {\n    touch-action: pan-y;\n    row-gap: calc(var(--scroll-mode-spacing) * 7px);\n    height: fit-content;\n  }\n\n[data-abreast-scroll]:is(.root___Hf5H2[data-scroll-mode] .mangaBox___48Jek) {\n    touch-action: none;\n    overflow: hidden;\n  }\n\n[data-abreast-scroll]:is(.root___Hf5H2[data-scroll-mode] .mangaBox___48Jek) .mangaFlow___jMZgq {\n      column-gap: calc(var(--scroll-mode-spacing) * 7px);\n      align-items: start;\n      height: 100%;\n    }\n\n:is([data-abreast-scroll]:is(.root___Hf5H2[data-scroll-mode] .mangaBox___48Jek) .mangaFlow___jMZgq) .img___7ajV4 {\n        width: 100%;\n        height: auto;\n      }\n\n[data-show]:is(:is([data-abreast-scroll]:is(.root___Hf5H2[data-scroll-mode] .mangaBox___48Jek) .mangaFlow___jMZgq) .img___7ajV4) {\n          will-change: transform;\n        }\n\n:is(:is([data-abreast-scroll]:is(.root___Hf5H2[data-scroll-mode] .mangaBox___48Jek) .mangaFlow___jMZgq) .img___7ajV4) > picture {\n          position: relative;\n        }\n\n.pageTip___P7thU {\n  pointer-events: none;\n\n  position: absolute;\n  z-index: 1;\n  right: 0.4em;\n  bottom: 0.4em;\n\n  padding: 0.1em 0.4em;\n  border-radius: 0.25em;\n\n  font-size: 1.5em;\n  line-height: 1.5;\n  color: var(--text);\n\n  opacity: 0;\n  background-color: color-mix(in srgb, var(--text-bg) 80%, transparent);\n\n  transition: opacity 150ms;\n}\n\n.root___Hf5H2[data-page-tip] .pageTip___P7thU {\n  opacity: 1;\n}\n\n@keyframes show___HzwUa {\n  0% {\n    opacity: 0;\n  }\n\n  90% {\n    opacity: 0;\n  }\n\n  100% {\n    opacity: 1;\n  }\n}\n\n.endPage___iOZmk,\n.endPageBody___g-dz- {\n  z-index: 10;\n\n  display: flex;\n  align-items: center;\n  justify-content: center;\n\n  width: 100%;\n  height: 100%;\n}\n\n.endPage___iOZmk {\n  pointer-events: none;\n\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  color: white;\n\n  opacity: 0;\n  background-color: #333d;\n\n  transition: opacity 500ms;\n}\n\n.endPage___iOZmk[data-show] {\n    pointer-events: all;\n    opacity: 1;\n  }\n\n.endPage___iOZmk[data-type='start'] .tip___fyxqg {\n    transform: translateY(-10em);\n  }\n\n.endPage___iOZmk[data-type='end'] .tip___fyxqg {\n    transform: translateY(10em);\n  }\n\n.endPage___iOZmk .endPageBody___g-dz- {\n    transform: translate(0, var(--drag-y, 0));\n    transition: transform 200ms;\n  }\n\n:is(.endPage___iOZmk .endPageBody___g-dz-) button {\n      cursor: pointer;\n\n      transform-origin: center;\n\n      font-size: 1.2em;\n      color: inherit;\n\n      background-color: transparent;\n\n      animation: jello___wXBLg 0.3s forwards;\n    }\n\n[data-is-end]:is(:is(.endPage___iOZmk .endPageBody___g-dz-) button) {\n        margin: 2em;\n        font-size: 3em;\n      }\n\n:is(.endPage___iOZmk .endPageBody___g-dz-) .tip___fyxqg {\n      position: absolute;\n      margin: auto;\n    }\n\n.endPage___iOZmk[data-drag] .endPageBody___g-dz- {\n    transition: transform 00ms;\n  }\n\n.root___Hf5H2[data-mobile] .endPage___iOZmk > button {\n  width: 1em;\n}\n\n.comments___9ITQv {\n  position: absolute;\n  right: 1em;\n\n  overflow: auto;\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end;\n\n  width: 20em;\n  max-height: 80%;\n  padding-right: 0.5em;\n\n  opacity: 0.3;\n}\n\n.comments___9ITQv > p {\n    margin: 0.5em 0.1em;\n    padding: 0.2em 0.5em;\n    border-radius: 0.5em;\n    background-color: #333b;\n  }\n\n.comments___9ITQv:hover {\n    opacity: 1;\n  }\n\n.root___Hf5H2[data-mobile] .comments___9ITQv {\n  bottom: 0;\n  max-height: 15em;\n  opacity: 0.8;\n}\n\n@keyframes jello___wXBLg {\n  0%,\n  11.1%,\n  100% {\n    transform: translate3d(0, 0, 0);\n  }\n\n  22.2% {\n    transform: skewX(-12.5deg) skewY(-12.5deg);\n  }\n\n  33.3% {\n    transform: skewX(6.25deg) skewY(6.25deg);\n  }\n\n  44.4% {\n    transform: skewX(-3.125deg) skewY(-3.125deg);\n  }\n\n  55.5% {\n    transform: skewX(1.5625deg) skewY(1.5625deg);\n  }\n\n  66.6% {\n    transform: skewX(-0.7812deg) skewY(-0.7812deg);\n  }\n\n  77.7% {\n    transform: skewX(0.3906deg) skewY(0.3906deg);\n  }\n\n  88.8% {\n    transform: skewX(-0.1953deg) skewY(-0.1953deg);\n  }\n}\n\n.toolbar___RMjHL {\n  position: fixed;\n  z-index: 9;\n  top: 0;\n\n  display: flex;\n  align-items: center;\n  justify-content: flex-start;\n\n  height: 100%;\n}\n\n/* 工具栏面板 */\n.toolbarPanel___XYjgc {\n  position: relative;\n  transform: translateX(-100%);\n\n  display: flex;\n  flex-direction: column;\n\n  padding: 0.5em;\n\n  transition: transform 200ms;\n}\n.toolbarPanel___XYjgc > hr {\n    height: 1em;\n    margin: 0;\n    border: none;\n    visibility: hidden;\n  }\n\n:is(.toolbar___RMjHL[data-show], .toolbar___RMjHL:hover) .toolbarPanel___XYjgc {\n  transform: none;\n}\n\n.toolbarBg___i4oTA {\n  position: absolute;\n  top: 0;\n  right: 0;\n\n  width: 100%;\n  height: 100%;\n  border-top-right-radius: 1em;\n  border-bottom-right-radius: 1em;\n\n  background-color: var(--page-bg);\n  filter: opacity(0.8);\n}\n\n/* 移动端优化 */\n/* 调大样式 */\n.root___Hf5H2[data-mobile] .toolbar___RMjHL {\n    font-size: 1.3em;\n  }\n/* 只能通过点击中心来唤出工具栏，防止误触 */\n.root___Hf5H2[data-mobile] .toolbar___RMjHL:not([data-show]) {\n    pointer-events: none;\n  }\n/* 减少背景的透明度，方便辨识 */\n.root___Hf5H2[data-mobile] .toolbarBg___i4oTA {\n    filter: opacity(0.8);\n  }\n/* 设置面板所在的悬浮框样式 */\n.SettingPanelPopper___uEBz3 {\n  pointer-events: unset !important;\n  transform: none !important;\n  height: 0 !important;\n  padding: 0 !important;\n}\n\n.SettingPanel___ZRvFB {\n  -webkit-user-select: text;\n          user-select: text;\n\n  position: fixed;\n  z-index: 1;\n  top: 0;\n  bottom: 0;\n\n  overflow: auto;\n\n  max-width: calc(100% - 5em);\n  height: fit-content;\n  max-height: 95%;\n  margin: auto;\n  border-radius: 0.3em;\n\n  font-size: 1.2em;\n  color: var(--text);\n\n  background-color: var(--page-bg);\n  box-shadow:\n    rgb(0 0 0 / 20%) 0 3px 1px -2px,\n    rgb(0 0 0 / 14%) 0 2px 2px 0,\n    rgb(0 0 0 / 12%) 0 1px 5px 0;\n}\n\n.SettingPanel___ZRvFB hr {\n    margin: 0.5em 0;\n    color: white;\n  }\n\n.SettingPanel___ZRvFB > hr {\n    margin: 0;\n  }\n\n.SettingBlock___qxNyt {\n  display: grid;\n  grid-template-rows: max-content 1fr;\n  transition: grid-template-rows 200ms ease-out;\n}\n\n.SettingBlock___qxNyt .SettingBlockBody___Wirnd {\n    z-index: 0;\n    overflow: hidden;\n    padding: 0 0.5em;\n    padding-bottom: 1em;\n  }\n\n:is(.SettingBlock___qxNyt .SettingBlockBody___Wirnd) > div + :is(.SettingBlock___qxNyt .SettingBlockBody___Wirnd) > div {\n      margin-top: 1em;\n    }\n\n:is(.SettingBlock___qxNyt .SettingBlockBody___Wirnd) input,:is(.SettingBlock___qxNyt .SettingBlockBody___Wirnd) textarea {\n      width: 97%;\n      margin-top: 0.3em;\n    }\n\n.SettingBlock___qxNyt[data-show='false'] {\n    grid-template-rows: max-content 0fr;\n    padding-bottom: unset;\n  }\n\n.SettingBlock___qxNyt[data-show='false'] .SettingBlockBody___Wirnd {\n      padding: unset;\n    }\n\n.SettingBlockSubtitle___cv0Ji {\n  cursor: pointer;\n\n  position: sticky;\n  z-index: 1;\n  top: 0;\n\n  height: 3em;\n  margin-bottom: 0.1em;\n\n  font-size: 0.7em;\n  line-height: 3em;\n  color: var(--text-secondary);\n  text-align: center;\n\n  background-color: var(--page-bg);\n}\n\n.SettingBlockBody___Wirnd .SettingBlockSubtitle___cv0Ji {\n  position: unset;\n  height: 1em;\n  line-height: 1em;\n}\n\n.SettingsItem___aJhRD {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n:is(.SettingsItem___aJhRD,.SettingsShowItem___l-D2E) + .SettingsItem___aJhRD {\n    margin-top: 1em;\n  }\n\n.SettingsItem___aJhRD[data-disabled] {\n    opacity: 0.5;\n  }\n\n.SettingsItem___aJhRD[data-disabled] button {\n      cursor: not-allowed;\n    }\n\n.SettingsItemName___UP6zJ {\n  max-width: calc(100% - 4em);\n\n  font-size: 0.9em;\n  text-align: start;\n  overflow-wrap: anywhere;\n  white-space: pre-wrap;\n}\n\n/* 开关式设置项 */\n.SettingsItemSwitch___LVGr9 {\n  cursor: pointer;\n\n  display: inline-flex;\n  align-items: center;\n\n  width: 2.3em;\n  height: 0.8em;\n  margin: 0.3em;\n  padding: 0;\n  border: 0;\n  border-radius: 1em;\n\n  background-color: var(--switch-bg);\n}\n\n/* 开关里的圆形按钮 */\n.SettingsItemSwitchRound___Ds0B8 {\n  transform: translateX(-10%);\n\n  width: 1.15em;\n  height: 1.15em;\n  border-radius: 100%;\n\n  background: var(--switch);\n  box-shadow:\n    0 2px 1px -1px rgb(0 0 0 / 20%),\n    0 1px 1px 0 rgb(0 0 0 / 14%),\n    0 1px 3px 0 rgb(0 0 0 / 12%);\n\n  transition: transform 100ms;\n}\n\n.SettingsItemSwitch___LVGr9[data-checked='true'] {\n  background: var(--secondary-bg);\n}\n\n.SettingsItemSwitch___LVGr9[data-checked='true'] .SettingsItemSwitchRound___Ds0B8 {\n    transform: translateX(110%);\n    background: var(--secondary);\n  }\n\n/* 图标按钮式设置项 */\n.SettingsItemIconButton___Cs7BQ {\n  cursor: pointer;\n\n  position: absolute;\n  right: 0;\n\n  height: 1em;\n  border: none;\n\n  font-size: 1.5em;\n  color: var(--text);\n\n  background-color: transparent;\n}\n\n/* 选择器设置项 */\n.SettingsItemSelect___CvFKx {\n  cursor: pointer;\n\n  max-width: 6.5em;\n  margin: 0;\n  padding: 0.3em;\n  border: none;\n  border-radius: 5px;\n\n  font-size: 0.9em;\n  color: var(--text);\n\n  background-color: var(--hover-bg-color);\n  outline: none;\n}\n.SettingsItemSelect___CvFKx::picker(select) {\n    color: var(--text);\n    background-color: var(--page-bg);\n  }\n.SettingsItemSelect___CvFKx option {\n    color: var(--text);\n    background-color: var(--page-bg);\n  }\n\n/* 关闭设置弹窗的遮罩 */\n.closeCover___qLIp5 {\n  position: fixed;\n  top: 0;\n  left: 0;\n\n  width: 100%;\n  height: 100%;\n}\n\n.SettingsShowItem___l-D2E {\n  display: grid;\n  transition: grid-template-rows 200ms ease-out;\n}\n\n.SettingsShowItem___l-D2E > .SettingsShowItemBody___bgxxq {\n    overflow: hidden;\n    display: flex;\n    flex-direction: column;\n  }\n\n:is(.SettingsShowItem___l-D2E > .SettingsShowItemBody___bgxxq) > .SettingsItem___aJhRD {\n      margin-top: 1em;\n    }\n\n:is(.SettingsShowItem___l-D2E > .SettingsShowItemBody___bgxxq) > :is(textarea,input) {\n      margin: 0.4em 0.2em 0;\n      line-height: 1.2;\n    }\n\n[data-only-number] {\n  padding: 0 0.2em;\n}\n\n[data-only-number] + span {\n    margin-left: -0.1em;\n  }\n\n.hotkeys___uu-Xe {\n  position: relative;\n  z-index: 1;\n\n  display: flex;\n  flex-grow: 1;\n  flex-wrap: wrap;\n  align-items: center;\n\n  padding: 0.2em;\n  padding-top: 2em;\n  border-bottom: 1px solid var(--secondary-bg);\n\n  font-size: 0.9em;\n  color: var(--text);\n}\n\n.hotkeys___uu-Xe + .hotkeys___uu-Xe {\n    margin-top: 0.5em;\n  }\n\n.hotkeys___uu-Xe:last-child {\n    border-bottom: none;\n  }\n\n.hotkeysItem___d9IKS {\n  cursor: pointer;\n\n  display: flex;\n  align-items: center;\n\n  box-sizing: content-box;\n  height: 1em;\n  margin: 0.3em;\n  padding: 0.2em 1.2em;\n  border-radius: 0.3em;\n\n  font-family: serif;\n\n  outline: 1px solid;\n  outline-color: var(--secondary-bg);\n}\n\n.hotkeysItem___d9IKS > svg {\n    display: none;\n\n    height: 1em;\n    margin-left: 0.4em;\n    border-radius: 1em;\n\n    color: var(--page-bg);\n\n    opacity: 0.5;\n    background-color: var(--text);\n  }\n\n:is(.hotkeysItem___d9IKS > svg):hover {\n      opacity: 0.9;\n    }\n\n.hotkeysItem___d9IKS:hover {\n    padding: 0.2em 0.5em;\n  }\n\n.hotkeysItem___d9IKS:hover > svg {\n      display: unset;\n    }\n\n.hotkeysItem___d9IKS:focus,.hotkeysItem___d9IKS:focus-visible {\n    outline: var(--text) solid 2px;\n  }\n\n.hotkeysHeader___jU7vr {\n  position: absolute;\n  top: 0;\n  left: 0;\n\n  display: flex;\n  align-items: center;\n\n  box-sizing: border-box;\n  width: 100%;\n  padding: 0 0.5em;\n}\n\n.hotkeysHeader___jU7vr > p {\n    line-height: 1em;\n    text-align: start;\n    overflow-wrap: anywhere;\n    white-space: pre-wrap;\n\n    background-color: var(--page-bg);\n  }\n\n.hotkeysHeader___jU7vr > div[title] {\n    cursor: pointer;\n\n    transform: scale(0);\n\n    display: flex;\n\n    background-color: var(--page-bg);\n\n    transition: transform 100ms;\n  }\n\n:is(.hotkeysHeader___jU7vr > div[title]) > svg {\n      width: 1.6em;\n    }\n\n.hotkeys___uu-Xe:hover div[title] {\n  transform: scale(1);\n}\n\n.scrollbar___hLToV {\n  --arrow-y: clamp(\n    0.45em,\n    calc(var(--slider-midpoint)),\n    calc(var(--scroll-length) - 0.45em)\n  );\n\n  touch-action: none;\n  -webkit-user-select: none;\n          user-select: none;\n\n  position: absolute;\n  z-index: 9;\n  top: 1%;\n  right: 3px;\n\n  display: flex;\n  flex-direction: column;\n\n  width: 5px;\n  height: 98%;\n\n  /* 扩大触发范围 */\n  border-left: max(6vw, 1em) solid transparent;\n}\n\n.scrollbar___hLToV > div {\n    pointer-events: none;\n\n    display: flex;\n    flex-direction: column;\n    flex-grow: 1;\n    align-items: center;\n    justify-content: center;\n  }\n\n.scrollbarPage___qghUs {\n  transform-origin: bottom;\n  transform: scaleY(1);\n\n  flex-grow: 1;\n\n  width: 100%;\n  height: 100%;\n\n  background-color: var(--secondary);\n\n  transition: transform 1s;\n}\n\n.scrollbarPage___qghUs[data-type='loaded'] {\n    transform: scaleY(0);\n  }\n\n.scrollbarPage___qghUs[data-upscale] {\n    transform: scaleY(1);\n    background-color: #b39ddb;\n  }\n\n.scrollbarPage___qghUs[data-upscale='loading'] {\n    background-color: #d1c4e9;\n  }\n\n.scrollbarPage___qghUs[data-translation-type] {\n    transform-origin: top;\n    transform: scaleY(1);\n    background-color: transparent;\n  }\n\n.scrollbarPage___qghUs[data-translation-type='wait'] {\n    background-color: #81c784;\n  }\n\n.scrollbarPage___qghUs[data-translation-type='show'] {\n    background-color: #4caf50;\n  }\n\n.scrollbarPage___qghUs[data-translation-type='error'] {\n    background-color: #f005;\n  }\n\n.scrollbarPage___qghUs[data-type='wait'] {\n    opacity: 0.4;\n  }\n\n.scrollbarPage___qghUs[data-type='error'] {\n    background-color: #f005;\n  }\n\n/* 滚动条滑块 */\n.scrollbarSlider___r1fWf {\n  position: absolute;\n  z-index: 1;\n  transform: translateY(var(--slider-top));\n\n  justify-content: center;\n\n  width: 100%;\n  height: var(--slider-height);\n  border-radius: 1em;\n\n  opacity: 1;\n  background-color: #fff5;\n\n  transition:\n    transform 150ms,\n    opacity 150ms;\n}\n\n/* 悬浮框 */\n.scrollbarPoper___XK5Rk {\n  --poper-top: clamp(\n    0%,\n    calc(var(--slider-midpoint) - 50%),\n    calc(var(--scroll-length) - 100%)\n  );\n\n  position: absolute;\n  right: 2em;\n  transform: translateY(var(--poper-top));\n\n  width: fit-content;\n  min-width: 1em;\n  min-height: 1.5em;\n  padding: 0.2em 0.5em;\n  border-radius: 0.3em;\n\n  font-size: 0.8em;\n  line-height: 1.5em;\n  color: white;\n  text-align: center;\n  white-space: pre;\n\n  background-color: #303030;\n}\n\n/* 悬浮框箭头 */\n.scrollbar___hLToV::before {\n  content: '';\n\n  position: absolute;\n  right: 2em;\n  transform: translate(140%, calc(var(--arrow-y) - 50%));\n\n  border: 0.4em solid transparent;\n  border-left: 0.5em solid #303030;\n\n  background-color: transparent;\n}\n\n/*\n * 滚动条部件的显隐\n */\n\n/* 悬浮提示默认隐藏 */\n.scrollbar___hLToV::before,\n.scrollbarPoper___XK5Rk {\n  opacity: 0;\n  transition:\n    opacity 150ms,\n    transform 150ms;\n}\n\n/* 控制滚动条悬浮提示的显示 */\n:is(.scrollbar___hLToV:hover,.scrollbar___hLToV[data-force-show]) .scrollbarPoper___XK5Rk,:is(.scrollbar___hLToV:hover,.scrollbar___hLToV[data-force-show]) .scrollbarSlider___r1fWf,:is(.scrollbar___hLToV:hover,.scrollbar___hLToV[data-force-show])::before {\n    opacity: 1;\n  }\n\n/* 拖动滚动条时取消移动过渡动画，确保跟手 */\n.scrollbar___hLToV[data-drag]::before,.scrollbar___hLToV[data-drag] .scrollbarPoper___XK5Rk,.scrollbar___hLToV[data-drag] .scrollbarSlider___r1fWf {\n    transition: opacity 150ms;\n  }\n\n/* 实现自动隐藏 */\n.scrollbar___hLToV[data-auto-hidden]:not([data-force-show]) .scrollbarSlider___r1fWf {\n    opacity: 0;\n  }\n.scrollbar___hLToV[data-auto-hidden]:not([data-force-show]):hover .scrollbarSlider___r1fWf {\n    opacity: 1;\n  }\n\n/*\n * 滚动条位置\n */\n\n.scrollbar___hLToV[data-position='hidden'] {\n  display: none;\n}\n\n.scrollbar___hLToV[data-position='top'] {\n  top: 1px;\n\n  /* 扩大触发范围 */\n  border-bottom: max(6vh, 1em) solid transparent;\n}\n\n.scrollbar___hLToV[data-position='top']::before {\n    top: 1.2em;\n    right: 0;\n    transform: translate(var(--arrow-x), -120%);\n    border-bottom: 0.5em solid #303030;\n  }\n\n.scrollbar___hLToV[data-position='top'] .scrollbarPoper___XK5Rk {\n    top: 1.2em;\n  }\n\n.scrollbar___hLToV[data-position='bottom'] {\n  top: unset;\n  bottom: 1px;\n\n  /* 扩大触发范围 */\n  border-top: max(6vh, 1em) solid transparent;\n}\n\n.scrollbar___hLToV[data-position='bottom']::before {\n    right: 0;\n    bottom: 1.2em;\n    transform: translate(var(--arrow-x), 120%);\n    border-top: 0.5em solid #303030;\n  }\n\n.scrollbar___hLToV[data-position='bottom'] .scrollbarPoper___XK5Rk {\n    bottom: 1.2em;\n  }\n\n.scrollbar___hLToV[data-position='top'],\n.scrollbar___hLToV[data-position='bottom'] {\n  --arrow-x: calc(var(--arrow-y) * -1 + 50%);\n\n  right: 1%;\n\n  flex-direction: row-reverse;\n\n  width: 98%;\n  height: 5px;\n  border-left: none;\n}\n\n:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom'])::before {\n    border-left: 0.4em solid transparent;\n  }\n\n/* stylelint-disable-next-line no-descending-specificity */\n\n:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) .scrollbarSlider___r1fWf {\n    transform: translateX(calc(var(--slider-top) * -1));\n    width: var(--slider-height);\n    height: 100%;\n  }\n\n:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) .scrollbarPoper___XK5Rk {\n    right: unset;\n    transform: translateX(calc(var(--poper-top) * -1));\n    padding: 0.1em 0.3em;\n  }\n\n[data-dir='ltr']:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) {\n    --arrow-x: calc(var(--arrow-y) - 50%);\n\n    flex-direction: row;\n  }\n\n[data-dir='ltr']:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom'])::before {\n      right: unset;\n      left: 0;\n    }\n\n/* stylelint-disable-next-line no-descending-specificity */\n\n[data-dir='ltr']:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) .scrollbarSlider___r1fWf {\n      transform: translateX(var(--top));\n    }\n\n[data-dir='ltr']:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) .scrollbarPoper___XK5Rk {\n      transform: translateX(var(--poper-top));\n    }\n\n/* 将 scaleY 改成 scaleX */\n\n:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) .scrollbarPage___qghUs {\n    transform: scaleX(1);\n  }\n\n[data-type='loaded']:is(:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) .scrollbarPage___qghUs) {\n      transform: scaleX(0);\n    }\n\n[data-translation-type]:is(:is(.scrollbar___hLToV[data-position='top'],.scrollbar___hLToV[data-position='bottom']) .scrollbarPage___qghUs) {\n      transform: scaleX(1);\n    }\n\n/* stylelint-disable-next-line no-descending-specificity */\n\n.scrollbar___hLToV[data-is-abreast-mode] .scrollbarPoper___XK5Rk {\n    writing-mode: vertical-rl;\n    line-height: 1.5em;\n    text-orientation: upright;\n  }\n\n.scrollbar___hLToV[data-is-abreast-mode][data-dir='ltr'] .scrollbarPoper___XK5Rk {\n    writing-mode: vertical-lr;\n  }\n\n/* 卷轴模式下取消滚动条的位移动画 */\n.root___Hf5H2[data-scroll-mode] .scrollbar___hLToV::before,\n.root___Hf5H2[data-scroll-mode] :is(.scrollbarSlider___r1fWf, .scrollbarPoper___XK5Rk) {\n  transition: opacity 150ms;\n}\n\n/* 移动端下禁用悬浮显示 */\n:is(.root___Hf5H2[data-mobile] .scrollbar___hLToV:hover)::before,:is(.root___Hf5H2[data-mobile] .scrollbar___hLToV:hover) .scrollbarPoper___XK5Rk {\n      opacity: 0;\n    }\n.touchAreaRoot___UN-W1 {\n  pointer-events: none;\n  -webkit-user-select: none;\n          user-select: none;\n\n  position: absolute;\n  top: 0;\n\n  display: grid;\n  grid-template-columns: 1fr min(30%, 10em) 1fr;\n  grid-template-rows: 1fr min(20%, 10em) 1fr;\n\n  width: 100%;\n  height: 100%;\n\n  font-size: 3em;\n  color: white;\n  letter-spacing: 0.5em;\n\n  opacity: 0;\n\n  transition: opacity 400ms;\n}\n.touchAreaRoot___UN-W1[data-show] {\n    opacity: 1;\n  }\n.touchAreaRoot___UN-W1 .touchArea___F6Hkh {\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    text-align: center;\n  }\n[data-area='prev']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh),[data-area='PREV']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh) {\n      background-color: #95e1d3e6;\n    }\n[data-area='menu']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh),[data-area='MENU']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh) {\n      background-color: #fce38ae6;\n    }\n[data-area='next']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh),[data-area='NEXT']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh) {\n      background-color: #f38181e6;\n    }\n[data-area='PREV']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh)::after {\n      content: var(--i18n-touch-area-prev);\n    }\n[data-area='MENU']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh)::after {\n      content: var(--i18n-touch-area-menu);\n    }\n[data-area='NEXT']:is(.touchAreaRoot___UN-W1 .touchArea___F6Hkh)::after {\n      content: var(--i18n-touch-area-next);\n    }\n.touchAreaRoot___UN-W1[data-vert='true'] {\n    flex-direction: column !important;\n  }\n.touchAreaRoot___UN-W1:not([data-turn-page]) .touchArea___F6Hkh[data-area='next'],.touchAreaRoot___UN-W1:not([data-turn-page]) .touchArea___F6Hkh[data-area='NEXT'],.touchAreaRoot___UN-W1:not([data-turn-page]) .touchArea___F6Hkh[data-area='prev'],.touchAreaRoot___UN-W1:not([data-turn-page]) .touchArea___F6Hkh[data-area='PREV'] {\n      visibility: hidden;\n    }\n.touchAreaRoot___UN-W1[data-shrink-menu] {\n    grid-template-columns: 1fr 2em 1fr;\n  }\n.touchAreaRoot___UN-W1[data-shrink-menu] .touchArea___F6Hkh[data-area='MENU'] {\n      letter-spacing: 0;\n    }\n\n.root___Hf5H2[data-mobile] .touchAreaRoot___UN-W1 {\n    flex-direction: column !important;\n    letter-spacing: 0;\n  }\n\n.root___Hf5H2[data-mobile] [data-area]::after {\n    font-size: 0.8em;\n  }\n\n.loadingMask___jIxGF {\n  position: absolute;\n  z-index: 20;\n  inset: 0;\n\n  display: flex;\n  align-items: center;\n  justify-content: center;\n\n  color: var(--text);\n\n  background-color: var(--bg);\n\n  animation: loadingMaskFadeIn___abNXH 300ms;\n}\n\n.loadingMask___jIxGF p {\n    font-size: 1.5em;\n    animation: loadingMaskBlink___O8MCV 1.5s infinite;\n  }\n\n@keyframes loadingMaskFadeIn___abNXH {\n  from {\n    opacity: 0;\n  }\n}\n\n@keyframes loadingMaskBlink___O8MCV {\n  0% {\n    opacity: 0.2;\n  }\n\n  50% {\n    opacity: 0.9;\n  }\n\n  100% {\n    opacity: 0.2;\n  }\n}\n\n.root___Hf5H2 {\n  position: relative;\n\n  overflow: hidden;\n\n  width: 100%;\n  height: 100%;\n\n  font-size: 1em;\n\n  background-color: var(--bg);\n  outline: 0;\n}\n\n.root___Hf5H2 a {\n    color: var(--text-secondary);\n  }\n\n.root___Hf5H2[data-mobile] {\n    font-size: 0.8em;\n  }\n\n.hidden___rxU-6 {\n  display: none !important;\n}\n\n.invisible___cO-hs {\n  visibility: hidden !important;\n}\n\n.beautifyScrollbar___lb6kJ {\n  /* 火狐的滚动条样式 */\n  scrollbar-color: var(--scrollbar-slider) transparent;\n  scrollbar-width: thin;\n\n  /* chrome 的滚动条样式 */\n}\n\n.beautifyScrollbar___lb6kJ::-webkit-scrollbar {\n    width: 5px;\n    height: 10px;\n  }\n\n.beautifyScrollbar___lb6kJ::-webkit-scrollbar-track {\n    background: transparent;\n  }\n\n.beautifyScrollbar___lb6kJ::-webkit-scrollbar-thumb {\n    background: var(--scrollbar-slider);\n  }\n\np,\nimg {\n  margin: 0;\n}\n\n:where(div, div:focus, div:focus-within, div:focus-visible, button) {\n  border: none;\n  outline: none;\n}\n\nblockquote {\n  margin: 0.5em 0;\n  padding: 0;\n  padding-left: 1em;\n  border-left: 0.25em solid var(--text-secondary, #607d8b);\n\n  font-size: 0.9em;\n  font-style: italic;\n  line-height: 1.2em;\n  color: var(--text-secondary);\n  text-align: start;\n  overflow-wrap: anywhere;\n  white-space: pre-wrap;\n}\n\nsvg {\n  width: 1em;\n}\n";
//#endregion
//#region src/components/Manga/index.tsx
var _tmpl$ = /*#__PURE__*/ solid_js_web.template(`<div>`);
solid_js.enableScheduling();
/** 漫画组件 */
const Manga = (props) => {
	css$1(index_module_default);
	useCssVar();
	solid_js.onMount(() => useInit(props));
	solid_js.createEffect(() => props.show && focus());
	return (() => {
		var _el$ = _tmpl$();
		solid_js_web.addEventListener(_el$, "wheel", handleWheel);
		solid_js_web.addEventListener(_el$, "mousedown", handleMouseDown);
		solid_js_web.addEventListener(_el$, "click", stopPropagation);
		var _ref$ = bindRef("root");
		typeof _ref$ === "function" && solid_js_web.use(_ref$, _el$);
		_el$.addEventListener("keydown", handleKeyDown, true);
		_el$.addEventListener("keyup", handleKeyUp, true);
		solid_js_web.insert(_el$, solid_js_web.createComponent(ComicImgFlow, {}), null);
		solid_js_web.insert(_el$, solid_js_web.createComponent(TouchArea, {}), null);
		solid_js_web.insert(_el$, solid_js_web.createComponent(Scrollbar, {}), null);
		solid_js_web.insert(_el$, solid_js_web.createComponent(WheelProgress, {}), null);
		solid_js_web.insert(_el$, solid_js_web.createComponent(EndPage, {}), null);
		solid_js_web.insert(_el$, solid_js_web.createComponent(Toolbar, {}), null);
		solid_js_web.insert(_el$, solid_js_web.createComponent(solid_js.Show, {
			get when() {
				return store.imgList.length === 0;
			},
			get children() {
				return solid_js_web.createComponent(LoadingMask, {});
			}
		}), null);
		solid_js_web.effect((_p$) => {
			var _v$ = classes$2.root, _v$2 = {
				[classes$2.hidden]: props.show === false,
				[props.class ?? ""]: Boolean(props.class),
				...props.classList
			}, _v$3 = helper.boolDataVal(store.isMobile), _v$4 = helper.boolDataVal(store.option.scrollMode.enabled), _v$5 = helper.boolDataVal(store.option.pageTip === "always" || store.option.pageTip === "auto" && (store.show.pageTip || store.isScrollbarHover));
			_v$ !== _p$.e && solid_js_web.className(_el$, _p$.e = _v$);
			_p$.t = solid_js_web.classList(_el$, _v$2, _p$.t);
			_v$3 !== _p$.a && solid_js_web.setAttribute(_el$, "data-mobile", _p$.a = _v$3);
			_v$4 !== _p$.o && solid_js_web.setAttribute(_el$, "data-scroll-mode", _p$.o = _v$4);
			_v$5 !== _p$.i && solid_js_web.setAttribute(_el$, "data-page-tip", _p$.i = _v$5);
			return _p$;
		}, {
			e: void 0,
			t: void 0,
			a: void 0,
			o: void 0,
			i: void 0
		});
		return _el$;
	})();
};
//#endregion
exports.DRAG_TURN_ANIMATION_DURATION = DRAG_TURN_ANIMATION_DURATION;
exports.DownloadButton = DownloadButton;
exports.Manga = Manga;
exports.SettingBlockSubtitle = SettingBlockSubtitle;
exports.SettingButton = SettingButton;
exports.SettingHotkeys = SettingHotkeys;
exports.SettingPanelContainer = SettingPanelContainer;
exports.SettingsItem = SettingsItem;
exports.SettingsItemButton = SettingsItemButton;
exports.SettingsItemNumber = SettingsItemNumber;
exports.SettingsItemSwitch = SettingsItemSwitch;
exports._setAbreastScrollFill = _setAbreastScrollFill;
exports.abreastArea = abreastArea;
exports.abreastColumnWidth = abreastColumnWidth;
exports.abreastContentWidth = abreastContentWidth;
exports.abreastScrollFill = abreastScrollFill;
exports.abreastScrollWidth = abreastScrollWidth;
exports.abreastShowColumn = abreastShowColumn;
exports.activeImgIndex = activeImgIndex;
exports.activePage = activePage;
exports.allowBatchTranslation = allowBatchTranslation;
exports.autoPageNum = autoPageNum;
exports.bindOption = bindOption;
exports.bindRef = bindRef;
exports.bindScrollTop = bindScrollTop;
exports.bound = bound;
exports.cancelTurnAnimation = cancelTurnAnimation;
exports.checkImgSize = checkImgSize;
exports.constantScroll = constantScroll;
exports.contentHeight = contentHeight;
exports.cotransSettings = cotransSettings;
exports.defaultHotkeys = defaultHotkeys;
exports.defaultOption = defaultOption;
exports.detectScrollDevice = detectScrollDevice;
exports.doubleClickZoom = doubleClickZoom;
exports.findTopPage = findTopPage;
exports.finishTurnAnimation = finishTurnAnimation;
exports.focus = focus;
exports.getCropMargin = getCropMargin;
exports.getImg = getImg;
exports.getImgDisplaySize = getImgDisplaySize;
exports.getImgEle = getImgEle;
exports.getImgIndexs = getImgIndexs;
exports.getImgTip = getImgTip;
exports.getImgType = getImgType;
exports.getPageTip = getPageTip;
exports.getPageTop = getPageTop;
exports.getTurnPageDir = getTurnPageDir;
exports.handleClick = handleClick;
exports.handleComicData = handleComicData;
exports.handleEndTurnPage = handleEndTurnPage;
exports.handleHotkey = handleHotkey;
exports.handleImgError = handleImgError;
exports.handleImgLoaded = handleImgLoaded;
exports.handleKeyDown = handleKeyDown;
exports.handleKeyUp = handleKeyUp;
exports.handleMangaFlowDrag = handleMangaFlowDrag;
exports.handleMouseDown = handleMouseDown;
exports.handlePinchZoom = handlePinchZoom;
exports.handleScrollModeDrag = handleScrollModeDrag;
exports.handleScrollModeZoom = handleScrollModeZoom;
exports.handleScrollbarSlider = handleScrollbarSlider;
exports.handleWheel = handleWheel;
exports.handleZoomDrag = handleZoomDrag;
exports.hotkeysMap = hotkeysMap;
exports.imgIndexMap = imgIndexMap;
exports.imgList = imgList;
exports.imgPageMap = imgPageMap;
exports.initStore = initStore;
exports.isAbreastMode = isAbreastMode;
exports.isBottom = isBottom;
exports.isDoubleMode = isDoubleMode;
exports.isDrag = isDrag;
exports.isEnableBg = isEnableBg;
exports.isOnePageMode = isOnePageMode;
exports.isScrollMode = isScrollMode;
exports.isSingleMode = isSingleMode;
exports.isTop = isTop;
exports.isTranslatingAll = isTranslatingAll;
exports.isTranslatingImage = isTranslatingImage;
exports.isTranslatingToEnd = isTranslatingToEnd;
exports.isUpscale = isUpscale;
exports.isUseAutoScale = isUseAutoScale;
exports.isWideType = isWideType;
exports.jumpToImg = jumpToImg;
exports.jumpToPage = jumpToPage;
exports.listenHotkey = listenHotkey;
exports.loadState = loadState;
exports.mitSettings = mitSettings;
exports.nowFillIndex = nowFillIndex;
exports.openScrollLock = openScrollLock;
exports.pageHeightList = pageHeightList;
exports.pageNum = pageNum;
exports.pageTopList = pageTopList;
exports.placeholderSize = placeholderSize;
exports.preloadNum = preloadNum;
exports.refs = refs;
exports.reloadImg = reloadImg;
exports.renderImgList = renderImgList;
exports.resetImgState = resetImgState;
exports.resetPage = resetPage;
exports.resetUI = resetUI;
exports.saveScrollProgress = saveScrollProgress;
exports.scrollBy = scrollBy;
exports.scrollDomLength = scrollDomLength;
exports.scrollLength = scrollLength;
exports.scrollPageList = scrollPageList;
exports.scrollPercentage = scrollPercentage;
exports.scrollPosition = scrollPosition;
exports.scrollProgress = scrollProgress;
exports.scrollTo = scrollTo;
exports.scrollTop = scrollTop;
exports.scrollViewImg = scrollViewImg;
exports.setAbreastScrollFill = setAbreastScrollFill;
exports.setAdjustToWidth = setAdjustToWidth;
exports.setDefaultHotkeys = setDefaultHotkeys;
exports.setImgScale = setImgScale;
exports.setImgTranslationEnbale = setImgTranslationEnbale;
exports.setIsDrag = setIsDrag;
exports.setOption = setOption;
exports.setState = setState;
exports.showImgList = showImgList;
exports.sliderHeight = sliderHeight;
exports.sliderMidpoint = sliderMidpoint;
exports.sliderTop = sliderTop;
exports.stopAutoScroll = stopAutoScroll;
exports.store = store;
exports.switchAutoScroll = switchAutoScroll;
exports.switchDir = switchDir;
exports.switchFillEffect = switchFillEffect;
exports.switchFullscreen = switchFullscreen;
exports.switchImgRecognition = switchImgRecognition;
exports.switchOnePageMode = switchOnePageMode;
exports.switchScrollMode = switchScrollMode;
exports.syncImgLoadState = syncImgLoadState;
exports.touches = touches;
exports.translateAll = translateAll;
exports.translateCurrent = translateCurrent;
exports.translateToEnd = translateToEnd;
exports.translationAll = translationAll;
exports.translationImage = translationImage;
exports.translationImgs = translationImgs;
exports.turnPage = turnPage;
exports.turnPageAnimation = turnPageAnimation;
exports.updateImgLoadType = updateImgLoadType;
exports.updateImgSize = updateImgSize;
exports.updateImgType = updateImgType;
exports.updateMitTranslators = updateMitTranslators;
exports.updatePageData = updatePageData;
exports.updateShowRange = updateShowRange;
exports.upscaleImage = upscaleImage;
exports.watchDomSize = watchDomSize;
exports.wheelRatchet = wheelRatchet;
exports.withOptionalState = withOptionalState;
exports.zoom = zoom;
