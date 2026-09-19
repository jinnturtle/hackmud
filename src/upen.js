function(ctx, args) { // tgt:#s.user.loc
    // ::: UNIPEN :::
    //
    // The universal penetrator.
    //
    // A lock picker that should adapt to many if not all locks in Hackmud.
    // Very early work in progress, based on my earlier project: c00x_bash.
    //
    // Depends on auxiliary data, run unipen_aux {cmd:"upload"} to upload to db,
    // only need to be done once.
    //
    // Author: JinnT
    //
    //
    // ::: History :::
    //
    // v0.2 - c003 works, EZ_40 times out if not lucky. Rebuilt the framework to
    // more easily add other lock solvers to this script in a fairly compact
    // manner (important as character count limited by Hackmud).
    // -------------------------------------------------------------------------

    // TODO Add ability to continue from last attempt (e.g. TIMEOUT), via DB
    // TODO Add ability to continue from partial solution, pld passed via args.
    // TODO Ability to tak an incomplete solution to speed through known vals.
    // TODO Option to disable the log print, is verbose outside dev.
    // TODO Bug: DATA_CHECK solver doesn't report failure properly.

    // TODO Reduce size signature
    //      20260918_1416 - 2,538
    //      20260918_1524 - 1,473
    //      20260918_1707 - 1,501

    const l = #fs.scripts.lib(),
          tgt = (args && args.tgt) ? args.tgt : null,
          // unverified idea floating in the forum that sometimes rewards get
          // lost if <1000ms remains, then x-1000 is the actual safety margin
          // accordint to the same forums, latency can get to 250ms so 1250?
          tthr = 1300, // exec time threshold, exit gracefully if less remains
          pid = "Unipen 1.0", // program ID (for data retrieval, help msg, etc)
          // program data
          pd = #db.f({_id:pid}).first();
    // TODO encapsulate thse last attempt variables, or I'm likely to shadow
    var last_lname, // last attacked lock name
        pld = {},   // attack payload
        last_key_i,  // if continuing, which step of a lock solution are we at
        last_val_i; // if continuing, which cycle of a lock solution step


	function usage() {
		return `\n*** HELP for ${pid} ***\n` + pd.help_txt;
	}

    // time to bail, wrap up and return
    function ttb() {
        #db.u(
            {_id:pid},
            { $set:
              {
                  pld:pld,
                  last_lname:last_lname,
                  last_key_i:last_key_i,
                  last_val_i:last_val_i
              }
            });
        return mkr(false, "`DTIMEOUT`");
    }

    // make return object
    function mkr(ok, msg) {
        return {ok:ok,
                msg:`${msg}\nbest:${tgt ? tgt.name : null}${JSON.stringify(pld)}` +
                "\n\n*** LOG ***\n\n" + l.get_log().join("\n")};
    }

    // TODO used in Scrape too, should be moved to a lib
    // make a RegExp out of string data {xpr:<expression>, f:<flags>}
    function s2rx(d) {
        return new RegExp(d.xpr, d.f);
    }


    // MAIN --------------------------------------------------------------------

    if (!pd) { return mkr(false, "bad aux data"); }

    // override attack global vars with supplied solution
    // (e.g. if continuing manually)
    pld = args.pld ? args.pld : {};
    last_lname = args.last_lock ? args.last_lock : "";

    // if continue mode, override attack global vars (including from args)
    if (args.c) {
        pld = pd.pld;
        last_lname = pd.last_lname;
        last_key_i = pd.last_key_i;
        last_val_i = pd.last_val_i;
    }



    // make RegExp objects out of the {xpr:<"expression">, f:"flags"} objects
    pd.lsigs = pd.lsigs.map(v => s2rx(v));

    if (!args || !tgt) {
        return mkr(false, usage());
    } else if (args.input === "h" || args.input === "help") {
        return mkr(true, usage());
    }


    // TODO consider reducing user of global variables if char count permits
    var atk_r; // attack return/response
    function atk() {
        l.log(pld);
        l.log(atk_r = tgt.call(pld));
    }

    atk();
    var lname = ""; // name of current lock we're breaking
    var im_in = false;
    while (!im_in) {
        var capture;

        if (lname !== last_lname) {
            lname = last_lname;
        } else {
            for (let sig of pd.lsigs) {
                if (l.is_arr(capture = sig.exec(atk_r))) {
                    lname = capture.pop();
                    last_lname = lname;
                    l.log("`FLOCK FOUND` " + lname)
                    break;
                }
            }
        }

        if (!l.is_def(pd.keys_dict[lname])) {
            // TODO print name of unsupported lock more nicely
            //      e.g. capture with /Denied access by (.*) lock/,
            return mkr(false, `unsupported lock: ${lname}`);
        }


        // TODO think of ways to restructure to separate solvers more nicely
        if (lname === "DATA_CHECK") {
            // map solver for e.g. DATA_CHECK
            for (let key in pd.keys_dict[lname]) {
                // payload with [key]="" prompts the lock to return query string
                pld[key] = "";
                atk();
                let qs = atk_r.split("\n"); // have to do this in order
                let a = ""; // concatenated answers to the query
                // TODO think if there's a more elegant solution .map maybe?
                for (let row of qs) {
                    for (let val of pd.keys_dict[lname][key]) {
                        a += row.includes(val.q) ? val.a : "";
                    }
                }

                pld[key] = a;
                atk();

                if (atk_r.includes(pd.fsig)) {
                    return mkr(false, `failed at ${lname}:${key}`);
                }
            }
        } else {
            // brute force solver for e.g. c001,2,3 EZ_XX, l0cket
            let fail = true;
            // TODO can this be more compact with a e.g. .forEach()?
            let keys = Object.keys(pd.keys_dict[lname]);
            for (let key_i = 0; key_i < keys.length; key_i++) {
                if (key_i < last_key_i) { continue; }
                last_key_i = key_i;

                let vals = pd.keys_dict[lname][keys[key_i]];
                for (let val_i = 0; val_i < vals.length; val_i++) {
                    if (val_i < last_val_i) { continue; }
                    last_val_i = val_i;

                    if (!l.can_continue_execution(tthr)) { // time time time
                        return ttb();
                    }

                    pld[keys[key_i]] = vals[val_i];
                    atk();
                    if (!(fail = atk_r.includes(pd.fsig))) { // TODO would regex be more compact?
                        break;
                    }
                }
                last_val_i = 0;

                if (fail) {
                    return mkr(false, `failed at ${lname}:${keys[key_i]}`);
                }
            }
            last_key_i = 0;
        }

        im_in = !atk_r.includes("LOCK_ERROR")
    }

    return mkr(im_in, "");
}
