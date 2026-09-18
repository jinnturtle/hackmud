function(context, args) { // tgt:#s.user.loc
    // ::: UNIPEN :::
    //
    // The universal penetrator.
    //
    // A lock picker that should adapt to many if not all locks in Hackmud.
    // Very early work in progress, based on my earlier project: c00x_bash.
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

    const l = #fs.scripts.lib(),
          v_maj = 0,
		  v_min = 2,
          tthr = 1500, // exec time threshold, exit gracefully if less remains
          fsig = "not the",
          // lock signature regexes
          lsigs = [
              /`N(c00.)`/,   // CORE c00x family: c001, c002, ...
              /`N(EZ_..)`/,  // HALPERYON SYSTEMS EZ_x: EZ_21, EZ_35, ...
              /`N(l0\w+)`/,  // l0cket, l0ckbox
              /`N(DAT\w+)`/, // DATA_CHECK
          ],
          unksig = /Denied access by (.*) lock/,
          // c00X colors
          colors = ["orange", "red", "yellow", "blue",
                    "purple", "cyan", "lime", "green"],
          color_digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          // EZ_XX unlock commands
          ez_cmds = ["open", "unlock", "release"],
          // EZ_35 digits
          ez_digits = color_digits,
          // EZ_40 primes
          // TODO not sure how many we actually need (guess 25), highest
          //      observed so far was 67
          ez_primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43,
                       47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97],
          k3ys = ["vc2c7q", "tvfkyq", "72umy0", "pmvr1q"], // TODO gather more
          data_check_map = [
              // safety depends on the use of scripts.++++++
              {q:"safety dep", a:"get_level"}, // TODO test
              // a ++++++ is a household cleaning device with a rudimentary
              {q:"++ is a house", a:"robovac"}, // tested
              // user ++++++ uses the port epoch environment to request gc
              {q:"to request gc", a:"outta_juice"}, // tested
              // communications issued by user ++++++ demonstrate structural
              // patterns associated with humor
              {q:"th humor", a:"sans_comedy"}, // tested
              // pet, pest, plague and meme are accurate descriptors of the ++++
              {q:"pet,", a:"bunnybat"} // TODO test
              // users gather in channel CAFE to share ++++++
              // {q:"CAFE", a: no idea} // TODO investigate CAFE
          ],
          // lock keys/args to crack
          keys_dict = {
              c001:{c001: colors,
                    color_digit: color_digits},
              c002:{c002: colors,
                    c002_complement: colors},
              c003:{c003: colors,
                    c003_triad_1: colors,
                    c003_triad_2: colors},
              EZ_21:{EZ_21: ez_cmds},
              EZ_35:{EZ_35: ez_cmds,
                     digit: ez_digits},
              EZ_40:{EZ_40: ez_cmds,
                     ez_prime: ez_primes},
              l0cket:{l0cket: k3ys},
              DATA_CHECK:{DATA_CHECK: data_check_map}
          };


	function usage() {
		let msg = `\n
*** HELP ***

NAME:
    Unipen v${v_maj}.${v_min}

INFO:
    Unlock locks of a loc. Currently supports:
    CORE  ....... c002, c003
    HALPERION  .. EZ_21, EZ_35, EZ_40

    Coming soon:
    CORE    ..... c001 (WIP, finalizing)
    Unknown ..... DATA_CHECK (WIP, partial, testing)
    Nuutec  ..... l0cket (WIP, partial, testing)

USAGE:
    ${context.this_script} {tgt: <loc>}

ARGS:
    tgt - target loc scriptor e.g. #s.user.script

`
		return msg;
	}

    var pld = {}; // attack payload
    // make return object
    function mkr(ok, msg) {
        return {ok:ok,
                msg:`${msg}\nbest:${args.tgt.name}${JSON.stringify(pld)}` +
                "\n\n*** LOG ***\n\n" + l.get_log().join("\n")};
    }

    // MAIN --------------------------------------------------------------------

    if (!l.is_def(args) || !l.is_def(args.tgt)) {
        return mkr(false, usage());
    } else if (args.input === "h" || args.input === "help") {
        return mkr(true, usage());
    }


    // TODO consider reducing user of global variables if char count permits
    var atk_r; // attack return/response
    function atk() {
        l.log(pld);
        l.log(atk_r = args.tgt.call(pld));
    }

    atk();
    var im_in = false;
    while (!im_in) {
        var lname = "", // lock name // TODO can probably double-use as capture too
            capture;

        for (let sig of lsigs) {
            if (l.is_arr(capture = sig.exec(atk_r))) {
                lname = capture.pop();
                l.log("`FLOCK FOUND` " + lname)
                break;
            }
        }

        if (!l.is_def(keys_dict[lname])) {
            return mkr(false, `unsupported lock: ${lname}`);
        }


        // TODO think of ways to restructure to separate solvers more nicely
        if (lname === "DATA_CHECK") {
            // map solver for e.g. DATA_CHECK
            for (let key in keys_dict[lname]) {
                // payload with [key]="" prompts the lock to return query string
                pld[key] = "";
                atk();
                let qs = atk_r.split("\n"); // have to do this in order
                let a = ""; // concatenated answers to the query
                // TODO think if there's a more elegant solution .map maybe?
                for (let row of qs) {
                    for (let val of keys_dict[lname][key]) {
                        a += row.includes(val.q) ? val.a : "";
                    }
                }

                pld[key] = a;
                atk();

                if (atk_r.includes(fsig)) {
                    return mkr(false, `failed at ${lname}:${key}`);
                }
            }
        } else {
            // brute force solver for e.g. c001,2,3 EZ_XX, l0cket
            let fail = true;
            for (let key in keys_dict[lname]) {
                for (let val of keys_dict[lname][key]) {
                    if (!l.can_continue_execution(tthr)) { // time time time
                        return mkr(false, "TIMEOUT");
                    }

                    pld[key] = val;
                    atk();
                    if (!(fail = atk_r.includes(fsig))) { // TODO would regex be more compact?
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
