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

    // TODO Add cheks of remaining time, dump info if about to get killed.
    // TODO Ability to tak an incomplete solution to speed through known vals.
    // TODO Option to disable the log print, is verbose outside dev.

    // TODO Reduce size signature
    //      20260918_1416 - 2,538
    //      20260918_1524 - 1,473
    //      20260918_1707 - 1,501

    const l = #fs.scripts.lib(),
          tgt = (args && args.tgt) ? args.tgt : null,
          tthr = 1500, // exec time threshold, exit gracefully if less remains
          pid = "Unipen 1.0", // program ID (for data retrieval, help msg, etc)
          // program data
          pd = #db.f({_id:pid}).first();

	function usage() {
		return `\n*** HELP for ${pid} ***\n` + pd.help_txt;
	}

    var pld = {}; // attack payload
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
    var im_in = false;
    while (!im_in) {
        var lname = "", // lock name // TODO can probably double-use as capture too
            capture;

        for (let sig of pd.lsigs) {
            if (l.is_arr(capture = sig.exec(atk_r))) {
                lname = capture.pop();
                l.log("`FLOCK FOUND` " + lname)
                break;
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
            for (let key in pd.keys_dict[lname]) {
                for (let val of pd.keys_dict[lname][key]) {
                    if (!l.can_continue_execution(tthr)) { // time time time
                        return mkr(false, "TIMEOUT");
                    }

                    pld[key] = val;
                    atk();
                    if (!(fail = atk_r.includes(pd.fsig))) { // TODO would regex be more compact?
                        break;
                    }
                }

                if (fail) {
                    return mkr(false, `failed at ${lname}:${key}`);
                }
            }
        }

        im_in = !atk_r.includes("LOCK_ERROR")
    }

    return mkr(im_in, "");
}
