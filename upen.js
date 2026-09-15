function(context, args) { // tgt:#s.user.loc
    // UNIPICK, the universal lock picker.
    // A lock picker that should adapt to many if not all locks in Hackmud.
    // Very early work in progress, based on my earlier project: c00x_bash.

    // TODO Add cheks of remaining time, dump info if about to get killed.
    // TODO Ability to tak an incomplete solution to speed through known vals.
    // TODO Option to disable the log print, is verbose outside dev.

    const l = #fs.scripts.lib(),
          f_sig = "not the",
          // lock signature regexes
          lsigs = [
              /`N(c00.)`/,   // CORE c00x family: c001, c002, ...
              /`N(EZ_..)`/ ], // HALPERYON SYSTEMS EZ_x: EZ_21, EZ_35, ...
          // c00X colors
          colors = ["orange", "red", "yellow", "blue", "purple", "cyan", "lime", "green"],
          // EZ_XX unlock commands
          ez_cmds = ["open", "unlock", "release"],
          // EZ_40 primes // TODO not sure how many we actually need (guess 25)
          ez_primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43,
                       47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97],
          // lock keys/args to crack
          keys_dict = {
              c001:{c001: colors},
              c002:{c002: colors,
                    c002_complement: colors},
              c003:{c003: colors,
                    c003_triad_1: colors,
                    c003_triad_2: colors},
              EZ_40:{EZ_40: ez_cmds,
                     ez_prime: ez_primes}
          };


	function usage() {
        // TODO v1.0 when supports all c00X and at least least one of the EZ_XX.
		const v_maj = 0,
		      v_min = 2;

		let msg = `\n
*** HELP ***

NAME:
    Unipick v${v_maj}.${v_min}

INFO:
    Unlock locks of a loc. Currently supports:
    CORE ........... c002, c003

    Coming soon:
    CORE ........... c001
    HALPERION EZ_ .. 21, 35, 40
    Nuutec ......... l0cket

USAGE:
    ${context.this_script} {tgt: <loc>}

ARGS:
    tgt - target loc scriptor e.g. #s.user.script

`
		return msg;
	}
    var atk_a = {};
    // make return object
    function mkr(ok, msg) {
        return {ok:ok,
                msg:`${msg}\nbest:${JSON.stringify(atk_a)}` +
                "\n\n*** LOG ***\n\n" + l.get_log().join("\n")};
    }

    // -------------------------------------------------------------------------

    if (!l.is_def(args) || !l.is_def(args.tgt)) {
        return mkr(false, usage());
    } else if (args.input === "h" || args.input === "help") {
        return mkr(true, usage());
    }


    var atk_r;
    function atk() {
        l.log(atk_a);
        l.log(atk_r = args.tgt.call(atk_a));
    }

    var keys;
    var vals; // lock vals

    atk();
    var im_in = false;
    while (!im_in) {
        var lname, // lock name // TODO can probably double-use as capture too
            capture;

        for (let sig of lsigs) {
            if (l.is_arr(capture = sig.exec(atk_r))) {
                lname = capture.pop();
                break;
            };
        }

        if (!l.is_def(keys_dict[lname])) {
            return mkr(false, `unsupported lock: ${lname}`);
        }

        let fail = true;
        for (let key in keys_dict[lname]) {
            for (let val of keys_dict[lname][key]) {
                atk_a[key] = val;
                atk();
                if (!(fail = atk_r.includes(f_sig))) { // TODO would regex be more compact?
                    break;
                }
            }

            if (fail) {
                return mkr(false, `failed at ${lname}:${key}`);
            }
        }

        im_in = !atk_r.includes("LOCK_ERROR")
    }

    return mkr(im_in, atk_a);
}
