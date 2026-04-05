import {
    PANEL_TYP_COUNTER,
    PANEL_TYP_TEXTBOX,
    PANEL_TYP_UNIT_CONVERTER,
    PANEL_TYP_MONEY_CONVERTER,
} from "./playerscreen-consts.js";
import { Counter } from "../dmscreen/dmscreen-counter.js";
import { NoteBox } from "../dmscreen/dmscreen-notebox.js";
import { UnitConverter } from "../dmscreen/dmscreen-unitconverter.js";
import { MoneyConverter } from "../dmscreen/dmscreen-moneyconverter.js";

export class PanelContentManagerFactory {
    static _PANEL_TYPES = {};

    static registerPanelType({ panelType, Cls }) {
        this._PANEL_TYPES[panelType] = Cls;
    }

    static async pFromSavedState({ board, saved, ixTab, panel }) {
        if (!this._PANEL_TYPES[saved.t]) return undefined;

        const ContentManager = new this._PANEL_TYPES[saved.t]({ board, panel });
        await ContentManager.pLoadState({ ixTab, saved });

        return true;
    }

    static getSaveableContent({ type, toSaveTitle, panelApp }) {
        if (!this._PANEL_TYPES[type]) return undefined;

        return this._PANEL_TYPES[type].getSaveableContent({ type, toSaveTitle, panelApp });
    }
}

class _PanelContentManager {
    static _PANEL_TYPE = null;
    static _TITLE = null;
    static _IS_STATELESS = false;

    static _register() {
        PanelContentManagerFactory.registerPanelType({ panelType: this._PANEL_TYPE, Cls: this });
        return null;
    }

    static getSaveableContent({ type, toSaveTitle, panelApp }) {
        return {
            t: type,
            r: toSaveTitle,
            s: this._IS_STATELESS ? {} : panelApp.getState(),
        };
    }

    constructor({ board, panel }) {
        this._board = board;
        this._panel = panel;
    }

    _getPanelApp({ state }) { throw new Error("Unimplemented!"); }

    async pDoPopulate({ state = {}, title = null } = {}) {
        const panelApp = this._getPanelApp({ state });

        this._panel.setEleContentTab({
            panelType: this.constructor._PANEL_TYPE,
            contentMeta: state,
            panelApp,
            eleContent: ee`<div class="panel-content-wrapper-inner"></div>`.appends(panelApp.getPanelElement()),
            title: title || this.constructor._TITLE,
            tabCanRename: true,
        });

        this._board.fireBoardEvent({ type: "panelPopulate", payload: { type: this.constructor._PANEL_TYPE } });
    }

    _doHandleTabRenamed({ ixTab, saved }) {
        if (saved.r != null) this._panel.tabDatas[ixTab].tabRenamed = true;
    }

    async pLoadState({ ixTab, saved }) {
        await this.pDoPopulate({ state: saved.s, title: saved.r });
        this._doHandleTabRenamed({ ixTab, saved });
    }
}

export class PanelContentManager_Counter extends _PanelContentManager {
    static _PANEL_TYPE = PANEL_TYP_COUNTER;
    static _TITLE = "Counter";
    static _ = this._register();
    _getPanelApp({ state }) { return Counter.getPanelApp({ board: this._board, savedState: state }); }
}

export class PanelContentManager_NoteBox extends _PanelContentManager {
    static _PANEL_TYPE = PANEL_TYP_TEXTBOX;
    static _TITLE = "Notes";
    static _ = this._register();
    _getPanelApp({ state }) { return NoteBox.getPanelApp({ board: this._board, savedState: state }); }
}

export class PanelContentManager_UnitConverter extends _PanelContentManager {
    static _PANEL_TYPE = PANEL_TYP_UNIT_CONVERTER;
    static _TITLE = "Unit Converter";
    static _ = this._register();
    _getPanelApp({ state }) { return UnitConverter.getPanelApp({ board: this._board, savedState: state }); }
}

export class PanelContentManager_MoneyConverter extends _PanelContentManager {
    static _PANEL_TYPE = PANEL_TYP_MONEY_CONVERTER;
    static _TITLE = "Coin Converter";
    static _ = this._register();
    _getPanelApp({ state }) { return MoneyConverter.getPanelApp({ board: this._board, savedState: state }); }
}
