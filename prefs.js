const GdkPixbuf = imports.gi.GdkPixbuf;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Gettext = imports.gettext.domain('gnome-workspace-bar-extensions;');
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Keys = Me.imports.keys;

const _N = function(x) { return x; }

const RADIO_BTNS = [
        "left",
        "center",
        "right"
    ];

function init() {
    Convenience.initTranslations();
}

function WorkspaceBarSettingsWidget() {
    this._init();
}

WorkspaceBarSettingsWidget.prototype = {

    _init: function() {
        this._grid = new Gtk.Grid();
        this._grid.margin = this._grid.row_spacing = this._grid.column_spacing = 10;
	    this._settings = Convenience.getSettings();

        let introLabel = _("Panel Position");
        let radio = null;

        this._grid.attach(new Gtk.Label({ label: introLabel, wrap: true, sensitive: true,
                                     margin_bottom: 10, margin_top: 5 }),
                                    0, 1, 1, 1);

        //build radio buttons
        let currentPosition = this._settings.get_string(Keys.POSITION);
        let count = 4;
        let str = '';
        for (element in RADIO_BTNS) {
            let str = RADIO_BTNS[element];
            radio = new Gtk.RadioButton({ group: radio, label: this._capitalised(str), valign: Gtk.Align.START });
            this._grid.attach(radio, count, 1, 1, 1);

            radio.connect('toggled', Lang.bind(this, function(widget) {
                if (widget.active)
                    this._settings.set_string(Keys.POSITION, str);
                }));

            if (currentPosition == str) radio.active = true;
            count++
        }
    },

    _capitalised: function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    _resetSettings: function() {
    },

    _completePrefsWidget: function() {
        let scollingWindow = new Gtk.ScrolledWindow({
                                 'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'hexpand': true, 'vexpand': true});
        scollingWindow.add_with_viewport(this._grid);
        scollingWindow.show_all();
        return scollingWindow;
    }
};

function buildPrefsWidget() {
    let widget = new WorkspaceBarSettingsWidget();
    return widget._completePrefsWidget();
}
