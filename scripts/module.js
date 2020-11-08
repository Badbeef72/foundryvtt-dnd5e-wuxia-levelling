import Item5e from "../../../systems/dnd5e/module/item/entity.js";
import Actor5e from "../../../systems/dnd5e/module/actor/entity.js";

/* ------------------------------------------- */
/*              Initialise Module              */
/* ------------------------------------------- */
Hooks.once('init', async function() {
    game.dnd5e.config.CHARACTER_EXP_LEVELS = [0, 250, 750, 2000, 3000, 4000, 8000, 10000, 12000, 20000, 25000, 30000, 40000, 45000, 50000, 75000, 80000, 85000, 100000, 110000, 120000, 150000, 175000, 200000, 300000, 350000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000];

    Item5e.prototype.prepareData = function() {
        Item.prototype.prepareData.call(this);

        // Get the Item's data
        const itemData = this.data;
        const data = itemData.data;
        const C = CONFIG.DND5E;
        const labels = {};
    
        // Classes
        if ( itemData.type === "class" ) {
          data.levels = Math.clamped(data.levels, 1, game.dnd5e.config.CHARACTER_EXP_LEVELS.length);
        }
    
        // Spell Level,  School, and Components
        if ( itemData.type === "spell" ) {
          labels.level = C.spellLevels[data.level];
          labels.school = C.spellSchools[data.school];
          labels.components = Object.entries(data.components).reduce((arr, c) => {
            if ( c[1] !== true ) return arr;
            arr.push(c[0].titleCase().slice(0, 1));
            return arr;
          }, []);
          labels.materials = data?.materials?.value ?? null;
        }
    
        // Feat Items
        else if ( itemData.type === "feat" ) {
          const act = data.activation;
          if ( act && (act.type === C.abilityActivationTypes.legendary) ) labels.featType = game.i18n.localize("DND5E.LegendaryActionLabel");
          else if ( act && (act.type === C.abilityActivationTypes.lair) ) labels.featType = game.i18n.localize("DND5E.LairActionLabel");
          else if ( act && act.type ) labels.featType = game.i18n.localize(data.damage.length ? "DND5E.Attack" : "DND5E.Action");
          else labels.featType = game.i18n.localize("DND5E.Passive");
        }
    
        // Equipment Items
        else if ( itemData.type === "equipment" ) {
          labels.armor = data.armor.value ? `${data.armor.value} ${game.i18n.localize("DND5E.AC")}` : "";
        }
    
        // Activated Items
        if ( data.hasOwnProperty("activation") ) {
    
          // Ability Activation Label
          let act = data.activation || {};
          if ( act ) labels.activation = [act.cost, C.abilityActivationTypes[act.type]].filterJoin(" ");
    
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
        if ( data.hasOwnProperty("actionType") ) {
    
          // Saving throws for unowned items
          const save = data.save;
          if ( save?.ability && !this.isOwned ) {
            if ( save.scaling !== "flat" ) save.dc = null;
            labels.save = game.i18n.format("DND5E.SaveDC", {dc: save.dc || "", ability: C.abilities[save.ability]});
          }
    
          // Damage
          let dam = data.damage || {};
          if ( dam.parts ) {
            labels.damage = dam.parts.map(d => d[0]).join(" + ").replace(/\+ -/g, "- ");
            labels.damageTypes = dam.parts.map(d => C.damageTypes[d[1]]).join(", ");
          }
        }
    
        // Assign labels
        this.labels = labels;
    }

    Actor5e.prototype._prepareCharacterData = function(actorData) {
        const data = actorData.data;
    
        // Determine character level and available hit dice based on owned Class items
        const [level, hd] = actorData.items.reduce((arr, item) => {
          if ( item.type === "class" ) {
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
});

Hooks.once('ready', async function() {

});