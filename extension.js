/* WorkspaceBar Extension
 * author: Mark Bokil
 * 9/16/12
 * version 1.0.1
 * credit: gcampax, some code from Workspace Indicator 
 */

const St        = imports.gi.St;
const Main      = imports.ui.main;
const Lang      = imports.lang;
const Clutter   = imports.gi.Clutter;
const Gio       = imports.gi.Gio;

const Gettext = imports.gettext.domain('gnome-workspace-bar-extensions');
const _       = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me             = ExtensionUtils.getCurrentExtension();
const Convenience    = Me.imports.convenience;
const Keys           = Me.imports.keys;

const DEBUG        = true;
const PREFS_DIALOG = 'gnome-shell-extension-prefs gnome-workspace-bar@github.com';

const DCONF_PATH        = 'org.gnome.desktop.wm.preferences';
const DCONF_KEY_WSNAMES = 'workspace-names';

function init(extensionMeta) {
	return new WorkspaceBar(extensionMeta);
}

function WorkspaceBar(extensionMeta) {
	this.init(extensionMeta);
}

function debug(str) {
	if (DEBUG) {
		str = "[ WorkspaceBar ]--------> " + str;
		global.log(str);
	}
}

WorkspaceBar.prototype = {
	init: function(extensionMeta) {
		this.extensionMeta = extensionMeta;
		this._settings = Convenience.getSettings();
		let dconf_settings = new Gio.Settings({
			schema_id: DCONF_PATH
		});
		this._names = dconf_settings.get_strv(DCONF_KEY_WSNAMES);
	},

	enable: function() {
		this._settingsSignals = [];
		this._settingsSignals.push(this._settings.connect('changed::' + Keys.POSITION, Lang.bind(this, this._setPosition)));
		this.boxPosition = this._settings.get_string(Keys.POSITION);
		this.boxMain = new St.BoxLayout();
		this.boxMain.add_style_class_name("panelBox");
		this.buttonBox = new St.Button();
		this.buttonBox.add_actor(this.boxMain);
		this.currentWorkSpace = this._getCurrentWorkSpace();

		// add box to panel
		let box = Main.panel["_" + this.boxPosition + "Box"];
		box.insert_child_at_index(this.buttonBox,0);

		this._screenSignals = [];
		this._screenSignals.push(global.screen.connect_after('workspace-removed', Lang.bind(this,this._buildWorkSpaceBtns)));
		this._screenSignals.push(global.screen.connect_after('workspace-added', Lang.bind(this,this._buildWorkSpaceBtns)));
		this._screenSignals.push(global.screen.connect_after('workspace-switched', Lang.bind(this,this._buildWorkSpaceBtns)));

		this._buildWorkSpaceBtns();
	},

	disable: function() {
		let box = Main.panel["_" + this.boxPosition + "Box"];
		box.remove_actor(this.buttonBox);
		this.buttonBox = null;

		// disconnect screen signals 
		for (x=0; x < this._screenSignals.length; x++) {
			global.screen.disconnect(this._screenSignals[x]);
		}
		this._screenSignals = [];
		this._screenSignals = null;

		// disconnect settings bindings 
		for (x=0; x < this._settingsSignals.length; x++) {
			global.screen.disconnect(this._settingsSignals[x]);
		}
		this._settingsSignals = [];
		this._settingsSignals = null;
	},

	_doPrefsDialog: function() {
		debug('right-click in onbtnpress: ' + global);
		Main.Util.trySpawnCommandLine(PREFS_DIALOG);

	},

	_setPosition: function() {
		let oldPosition = this.boxPosition;
		this.boxPosition = this._settings.get_string(Keys.POSITION);

		// remove box
		let box = Main.panel["_" + oldPosition + "Box"];
		box.remove_actor(this.buttonBox);

		// add box
		box = Main.panel["_" + this.boxPosition + "Box"];
		box.insert_child_at_index(this.buttonBox,0);
	},

	_getCurrentWorkSpace: function() {
		return global.screen.get_active_workspace().index();
	},

	_buildWorkSpaceBtns: function() {
		this._removeAllChildren(this.boxMain); //clear box container
		this.currentWorkSpace = this._getCurrentWorkSpace();
		this.buttons = []; //truncate arrays to release memory
		this.labels = [];
		let workSpaces = global.screen.n_workspaces - 1;

		for (i = 0; i < global.screen.n_workspaces; ++i) {
			let has_window = global.screen.get_workspace_by_index(i).list_windows().length > 0;
			this.labels[i] = new St.Label({ text: _(this._names[i]), style_class: i == this.currentWorkSpace ? "active" : (has_window ? "hasWindow" : "inactive") });

			this.buttons[i] = new St.Button(); //{style_class: "panel-button"}
			this.buttons[i].set_child(this.labels[i]);

			this.buttons[i].connect('button-press-event', Lang.bind(this, function(actor, event) {
				let button = event.get_button();
				if (button == 3) { //right click
					this._doPrefsDialog();
				} else {
					this._setWorkSpace(this._names.indexOf(actor.get_child().text)); //use text label for workspace index
				}
				}));

			this.buttons[i].connect('scroll-event', Lang.bind(this, this._onScrollEvent));
			this.boxMain.add_actor(this.buttons[i]);
		}

	},

	_removeAllChildren: function(box) {
		let children = box.get_children();

		if (children) {
			let len = children.length;

			for(x=len-1; x >= 0  ; x--) {
				box.remove_actor(children[x]);
			}
		}

	},

	_setWorkSpace: function(index) {
		//index--; //button labels are 1,2,3, off by +1

		try {
			let possibleWorkspace = global.screen.get_workspace_by_index(index);
			possibleWorkspace.activate(global.get_current_time());
		} catch(e) {
			global.logError(e);
			return;
		}

		this._buildWorkSpaceBtns(); //refresh GUI after add,remove,switch workspace
	},

	_activateScroll : function (offSet) {
		this.currentWorkSpace = this._getCurrentWorkSpace() + offSet;
		this.currentWorkspace = Math.min(this.currentWorkspace, global.screen.n_workspaces - 1);
		this.currentWorkspace = Math.max(this.currentWorkspace, 0);
		this._setWorkSpace(this.currentWorkSpace);
	},

	_onScrollEvent : function(actor, event) {
		let direction = event.get_scroll_direction();
		let offSet = 0;

		if (direction == Clutter.ScrollDirection.DOWN) {
			offSet = 1;
		} else if (direction == Clutter.ScrollDirection.UP) {
			offSet = -1;
		} else {
			return;
		}

		this._activateScroll(offSet);
	}
}

