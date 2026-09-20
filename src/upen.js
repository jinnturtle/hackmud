function(ctx, args) { // tgt:#s.user.loc, c:false
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
    // v1.0 - Most data now stored in aux DB, c001 support, penetration chance
    // improved for all partially supported locks.
    // -------------------------------------------------------------------------
    // v1.1_beta - can now continue after TIMEOUT
    // -------------------------------------------------------------------------
    // v1.1_beta2 - code restructure, scrapped passing state via args
    // -------------------------------------------------------------------------

    // TODO Bug: Minor. DATA_CHECK solver doesn't report failure properly.
    //      Doesn't fail anymore thought we have good soluton data.
    // TODO Bug: Script reports fail if account has no locks, tecnically that's
    //      a success.

    // TODO Option to disable the log print, is verbose outside dev.

    const l = #fs.scripts.lib(),
          tgt = (args && args.tgt) ? args.tgt : null,
          // unverified idea floating in the forum that sometimes rewards get
          // lost if <1000ms remains, then x-1000 is the actual safety margin
          // accordint to the same forums, latency can get to 250ms so 1250?
          tthr = 1300, // exec time threshold, exit gracefully if less remains
          pid = "Unipen 1.0", // program ID (for data retrieval, help msg, etc)
          // program data
          pd = #db.f({_id:pid}).first();
    // TODO consider reducing use of global variables if char count permits
    // TODO encapsulate these last attempt variables, or I'm likely to shadow
    var lln = "", // last attacked lock name
        pld = {},   // attack payload
        lki,  // last attempted key index (solver step)
        lvi; // last attempted key value index (solver step cycle)


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
                  lln:lln,
                  lki:lki,
                  lvi:lvi
              }
            });
        let m = "`DTIMEOUT`"
        l.log(m)
        return mkr(false, m)
    }

    // make return object
    function mkr(ok, msg) {
        if (!ok) {l.log("`DFAIL`")};
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

    // if continue mode, override attack global vars (including from args)
    if (args.c) {
        pld = pd.pld;
        lln = pd.lln;
        lki = pd.lki;
        lvi = pd.lvi;
    }


    // make RegExp objects out of the {xpr:<"expression">, f:"flags"} objects
    pd.lsigs = pd.lsigs.map(v => s2rx(v));

    if (!args || !tgt) {
        return mkr(false, usage());
    } else if (args.input === "h" || args.input === "help") {
        return mkr(true, usage());
    }


    // TODO consider reducing use of global variables if char count permits
    var atk_r; // attack return/response
    function atk() {
        l.log(pld);
        l.log(atk_r = tgt.call(pld));
    }

    atk();
    var ln = ""; // name of current lock we're breaking
    var im_in = false;
    while (!im_in) {
        var capture;

        if (ln !== lln) {
            ln = lln;
        } else {
            for (let sig of pd.lsigs) {
                if (l.is_arr(capture = sig.exec(atk_r))) {
                    ln = capture.pop();
                    lln = ln;
                    l.log("`FLOCK FOUND` " + ln);
                    break;
                }
            }
        }

        if (!l.is_def(pd.keys_dict[ln])) {
            // TODO print name of unsupported lock more nicely
            //      e.g. capture with /Denied access by (.*) lock/,
            return mkr(false, `unsupported lock: ${ln}`);
        }


        // TODO think of ways to restructure, to separate solvers more nicely
        if (ln === "DATA_CHECK") {
            // map solver for e.g. DATA_CHECK
            for (let key in pd.keys_dict[ln]) {
                // payload with [key]="" prompts the lock to return query string
                pld[key] = "";
                atk();
                let qs = atk_r.split("\n"); // have to do this in order
                let a = ""; // concatenated answers to the query
                // TODO think if there's a more elegant solution .map maybe?
                for (let row of qs) {
                    for (let val of pd.keys_dict[ln][key]) {
                        a += row.includes(val.q) ? val.a : "";
                    }
                }

                pld[key] = a;
                atk();

                // TODO bug, fsig is probably diffrent so even is not caught
                //      IIRC lock returns same query if usuccessful, so we can
                //      just check for "+++"
                if (atk_r.includes(pd.fsig)) {
                    return mkr(false, `failed at ${ln}:${key}`);
                }
            }
        } else {
            // brute force solver for e.g. c001,2,3 EZ_XX, l0cket
            let fail = true;
            for (let [ki,k] of Object.keys(pd.keys_dict[ln]).entries()) {
                if (ki < lki) { continue; } // seek if continuing
                lki = ki;
                for (let [vi,v] of pd.keys_dict[ln][k].entries()) {
                    if (vi < lvi) { continue; } // seek if continuing
                    lvi = vi;

                    if (!l.can_continue_execution(tthr)) { // time time time
                        return ttb();
                    }

                    pld[k] = v;
                    atk();
                    if (!(fail = atk_r.includes(pd.fsig))) { // TODO would regex be more compact?
                        break;
                    }
                }
                lvi = 0;

                if (fail) {
                    return mkr(false, `failed at ${ln}:${k}`);
                }
            }
            lki = 0;

        }

        im_in = !atk_r.includes("LOCK_ERROR");
    }

    return mkr(im_in, "");
}
