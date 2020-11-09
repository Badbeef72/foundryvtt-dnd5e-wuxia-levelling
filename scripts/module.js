import Item5e from "../../../systems/dnd5e/module/item/entity.js";
import Actor5e from "../../../systems/dnd5e/module/actor/entity.js";
import { DND5E } from '../../../systems/dnd5e/module/config.js';

/* ------------------------------------------- */
/*              Initialise Module              */
/* ------------------------------------------- */
Hooks.once('init', async function () {
    /* Overwriting Levels */
    game.dnd5e.config.CHARACTER_EXP_LEVELS = [
        0, 250, 750,                /* Disciple Realm */
        2000, 3000, 4000,           /* Practitioner Realm */
        8000, 10000, 12000,         /* Expert Realm */
        20000, 25000, 30000,        /* Master Realm */
        40000, 45000, 50000,        /* Venerate Realm */
        75000, 80000, 85000,        /* Lord Realm */
        100000, 110000, 120000,     /* King Realm */
        150000, 175000, 200000,     /* Emperor Realm */
        300000, 350000, 400000,     /* Sage Realm */
        500000, 600000, 700000,     /* Deity Realm */
        800000, 900000, 1000000     /* God Realm */
    ];


    /* Overwriting Spell Slot table */
    game.dnd5e.config.SPELL_SLOT_TABLE = [
        /* -------------- */
        /* Disciple Realm */
        /* -------------- */
        [],
        [],
        [],

        /* ------------------ */
        /* Practitioner Realm */
        /* ------------------ */
        [2],
        [2],
        [3],

        /* ------------ */
        /* Expert Realm */
        /* ------------ */
        [3, 1],
        [3, 1],
        [3, 2],

        /* ------------ */
        /* Master Realm */
        /* -------- --- */
        [4, 2, 1],
        [4, 2, 1],
        [4, 3, 2],

        /* -------------- */
        /* Venerate Realm */
        /* -------------- */
        [4, 3, 2, 1],
        [4, 3, 2, 1],
        [4, 3, 3, 2],

        /* ---------- */
        /* Lord Realm */
        /* ---------- */
        [4, 3, 3, 2, 1],
        [4, 3, 3, 2, 1],
        [4, 3, 3, 3, 1],

        /* ------- ----- */
        /*  King Realm   */
        /* ------------- */
        [4, 3, 3, 3, 2, 1],
        [4, 3, 3, 3, 2, 1],
        [4, 3, 3, 3, 2, 1],

        /* ---------------- */
        /*  Emperor Realm   */
        /* ---------------- */
        [4, 3, 3, 3, 2, 1, 1],
        [4, 3, 3, 3, 2, 1, 1],
        [4, 3, 3, 3, 2, 1, 1],

        /* ------------------- */
        /*     Sage Realm      */
        /* ------------------- */
        [4, 3, 3, 3, 2, 1, 1, 1],
        [4, 3, 3, 3, 2, 1, 1, 1],
        [4, 3, 3, 3, 2, 1, 1, 1],

        /* ---------------------- */
        /*      Deity Realm       */
        /* ---------------------- */
        [4, 3, 3, 3, 3, 1, 1, 1],
        [4, 3, 3, 3, 3, 1, 1, 1],
        [4, 3, 3, 3, 3, 2, 1, 1],

        /* ---------------------- */
        /*       God Realm        */
        /* ---------------------- */
        [4, 3, 3, 3, 3, 2, 2, 1, 1],
        [4, 3, 3, 3, 3, 2, 2, 1, 1],
        [4, 3, 3, 3, 3, 2, 2, 1, 1]
    ];


    /* Overwriting class item level cap */
    Item5e.prototype.prepareData = function () {
        Item.prototype.prepareData.call(this);

        // Get the Item's data
        const itemData = this.data;
        const data = itemData.data;
        const C = CONFIG.DND5E;
        const labels = {};

        // Classes
        if (itemData.type === "class") {
            data.levels = Math.clamped(data.levels, 1, game.dnd5e.config.CHARACTER_EXP_LEVELS.length);
        }

        // Spell Level,  School, and Components
        if (itemData.type === "spell") {
            labels.level = C.spellLevels[data.level];
            labels.school = C.spellSchools[data.school];
            labels.components = Object.entries(data.components).reduce((arr, c) => {
                if (c[1] !== true) return arr;
                arr.push(c[0].titleCase().slice(0, 1));
                return arr;
            }, []);
            labels.materials = data?.materials?.value ?? null;
        }

        // Feat Items
        else if (itemData.type === "feat") {
            const act = data.activation;
            if (act && (act.type === C.abilityActivationTypes.legendary)) labels.featType = game.i18n.localize("DND5E.LegendaryActionLabel");
            else if (act && (act.type === C.abilityActivationTypes.lair)) labels.featType = game.i18n.localize("DND5E.LairActionLabel");
            else if (act && act.type) labels.featType = game.i18n.localize(data.damage.length ? "DND5E.Attack" : "DND5E.Action");
            else labels.featType = game.i18n.localize("DND5E.Passive");
        }

        // Equipment Items
        else if (itemData.type === "equipment") {
            labels.armor = data.armor.value ? `${data.armor.value} ${game.i18n.localize("DND5E.AC")}` : "";
        }

        // Activated Items
        if (data.hasOwnProperty("activation")) {

            // Ability Activation Label
            let act = data.activation || {};
            if (act) labels.activation = [act.cost, C.abilityActivationTypes[act.type]].filterJoin(" ");

            // Target Label
            let tgt = data.target || {};
            if (["none", "touch", "self"].includes(tgt.units)) tgt.value = null;
            if (["none", "self"].includes(tgt.type)) {
                tgt.value = null;
                tgt.units = null;
            }
            labels.target = [tgt.value, C.distanceUnits[tgt.units], C.targetTypes[tgt.type]].filterJoin(" ");

            // Range Label
            let rng = data.range || {};
            if (["none", "touch", "self"].includes(rng.units) || (rng.value === 0)) {
                rng.value = null;
                rng.long = null;
            }
            labels.range = [rng.value, rng.long ? `/ ${rng.long}` : null, C.distanceUnits[rng.units]].filterJoin(" ");

            // Duration Label
            let dur = data.duration || {};
            if (["inst", "perm"].includes(dur.units)) dur.value = null;
            labels.duration = [dur.value, C.timePeriods[dur.units]].filterJoin(" ");

            // Recharge Label
            let chg = data.recharge || {};
            labels.recharge = `${game.i18n.localize("DND5E.Recharge")} [${chg.value}${parseInt(chg.value) < 6 ? "+" : ""}]`;
        }

        // Item Actions
        if (data.hasOwnProperty("actionType")) {

            // Saving throws for unowned items
            const save = data.save;
            if (save?.ability && !this.isOwned) {
                if (save.scaling !== "flat") save.dc = null;
                labels.save = game.i18n.format("DND5E.SaveDC", { dc: save.dc || "", ability: C.abilities[save.ability] });
            }

            // Damage
            let dam = data.damage || {};
            if (dam.parts) {
                labels.damage = dam.parts.map(d => d[0]).join(" + ").replace(/\+ -/g, "- ");
                labels.damageTypes = dam.parts.map(d => C.damageTypes[d[1]]).join(", ");
            }
        }

        // Assign labels
        this.labels = labels;
    }


    /* Overwriting Proficiency bonus calculation */
    Actor5e.prototype._prepareCharacterData = function (actorData) {
        const data = actorData.data;

        // Determine character level and available hit dice based on owned Class items
        const [level, hd] = actorData.items.reduce((arr, item) => {
            if (item.type === "class") {
                const classLevels = parseInt(item.data.levels) || 1;
                arr[0] += classLevels;
                arr[1] += classLevels - (parseInt(item.data.hitDiceUsed) || 0);
            }
            return arr;
        }, [0, 0]);
        data.details.level = level;
        data.attributes.hd = hd;

        // Character proficiency bonus
        data.attributes.prof = Math.floor((level + 11) / 6);

        // Experience required for next level
        const xp = data.details.xp;
        xp.max = this.getLevelExp(level || 1);
        const prior = this.getLevelExp(level - 1 || 0);
        const required = xp.max - prior;
        const pct = Math.round((xp.value - prior) * 100 / required);
        xp.pct = Math.clamped(pct, 0, 100);

        // Inventory encumbrance
        data.attributes.encumbrance = this._computeEncumbrance(actorData);
    }


    /* Overwriting Pact Magic level calculation */
    Actor5e.prototype._computeSpellcastingProgression = function (actorData) {
        if (actorData.type === 'vehicle') return;
        const spells = actorData.data.spells;
        const isNPC = actorData.type === 'npc';

        // Translate the list of classes into spell-casting progression
        const progression = {
            total: 0,
            slot: 0,
            pact: 0
        };

        // Keep track of the last seen caster in case we're in a single-caster situation.
        let caster = null;

        // Tabulate the total spell-casting progression
        const classes = this.data.items.filter(i => i.type === "class");
        for (let cls of classes) {
            const d = cls.data;
            if (d.spellcasting === "none") continue;
            const levels = d.levels;
            const prog = d.spellcasting;

            // Accumulate levels
            if (prog !== "pact") {
                caster = cls;
                progression.total++;
            }
            switch (prog) {
                case 'third': progression.slot += Math.floor(levels / 3); break;
                case 'half': progression.slot += Math.floor(levels / 2); break;
                case 'full': progression.slot += levels; break;
                case 'artificer': progression.slot += Math.ceil(levels / 2); break;
                case 'pact': progression.pact += levels; break;
            }
        }

        // EXCEPTION: single-classed non-full progression rounds up, rather than down
        const isSingleClass = (progression.total === 1) && (progression.slot > 0);
        if (!isNPC && isSingleClass && ['half', 'third'].includes(caster.data.spellcasting)) {
            const denom = caster.data.spellcasting === 'third' ? 3 : 2;
            progression.slot = Math.ceil(caster.data.levels / denom);
        }

        // EXCEPTION: NPC with an explicit spellcaster level
        if (isNPC && actorData.data.details.spellLevel) {
            progression.slot = actorData.data.details.spellLevel;
        }

        // Look up the number of slots per level from the progression table
        const levels = Math.clamped(progression.slot, 0, game.dnd5e.config.CHARACTER_EXP_LEVELS.length);
        const slots = DND5E.SPELL_SLOT_TABLE[levels - 1] || [];
        for (let [n, lvl] of Object.entries(spells)) {
            let i = parseInt(n.slice(-1));
            if (Number.isNaN(i)) continue;
            if (Number.isNumeric(lvl.override)) lvl.max = Math.max(parseInt(lvl.override), 1);
            else lvl.max = slots[i - 1] || 0;
            lvl.value = Math.min(parseInt(lvl.value), lvl.max);
        }

        // Determine the Actor's pact magic level (if any)
        let pl = Math.clamped(progression.pact, 0, game.dnd5e.config.CHARACTER_EXP_LEVELS.length);
        spells.pact = spells.pact || {};
        if ((pl === 0) && isNPC && Number.isNumeric(spells.pact.override)) pl = actorData.data.details.spellLevel;

        // Determine the number of Warlock pact slots per level
        if (pl > 0) {
            spells.pact.level = Math.ceil(Math.max(0, Math.min(pl - 4, 1), Math.min(pl - 5, 2), Math.min(pl - 5, 3), Math.min(pl - 10, 4), Math.min(pl - 12, 5)));
            if (Number.isNumeric(spells.pact.override)) spells.pact.max = Math.max(parseInt(spells.pact.override), 1);
            else spells.pact.max = Math.max(0, Math.min(pl - 3, 1), Math.min(pl - 4, 2), Math.min(pl - 13, 3), Math.min(pl - 18, 4), Math.min(pl - 23, 5));
            spells.pact.value = Math.min(spells.pact.value, spells.pact.max);
        }
        else {
            spells.pact.level = 0;
            spells.pact.max = 0;
        }
    }
});

Hooks.once('ready', async function () {

});