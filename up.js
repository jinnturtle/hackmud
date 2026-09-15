function(context, args) { // tgt:#s.user.loc
    // UNIPICK, the universal lock picker.
    // A lock picker that should adapt to many if not all locks in Hackmud.
    // Very early work in progress, based on my earlier project: c00x_bash.
	function usage() {
		let v_maj = 0;
		let v_min = 0;

		let msg = `\n
*** HELP ***

NAME:
    Unipick v${v_maj}.${v_min}

INFO:
    Unlock locks of a loc. Currently supports:
    Core c00: 2,3.

    Coming soon:
    Core ........... c001
    Halperion EZ_ .. 21, 35, 40
    Nuutec ......... l0cket

USAGE:
    ${context.this_script} {tgt: <loc>}

ARGS:
    tgt - target loc scriptor e.g. #s.user.script

`
		return msg;
	}

	const colors = ["orange", "red", "yellow", "blue", "purple", "cyan", "lime", "green"];

    if (args === null || args.tgt === null) {
        return {ok:false, msg:usage()};
    } else if (args.input === "h" || args.input === "help") {
        return {ok:true, msg:usage()};
    }

    var report = "\n\n*** REPORT ***\n\n";
    var f_sig = "is not" // fail signature
    var atk_a = {}, atk_r;
    function atk() {
        atk_r = args.tgt.call(atk_a);
        report += atk_r;
    }

    var keys; // lock keys/args to crack
    var vals; // lock vals

    atk();
    if (atk_r.includes("c001")) {
        keys = ["c001"]
        vals = [null]
    } else if (atk_r.includes("c002")) {
        keys = ["c002", "c002_complement"]
        vals = [null, null]
    } else if (atk_r.includes("c003")) {
        keys = ["c003", "c003_triad_1", "c003_triad_2"]
        vals = [null, null, null]
    } else {
        return {ok:false, msg:"unsupported lock type" + report + usage()};
    }

    for (let i = 0; i < vals.length; i++) {
        for (let j = 0; j < colors.length; j++) {
            atk_a[keys[i]] = colors[j];
            atk();
            if (!atk_r.includes(f_sig)) {
                vals[i] = colors[j];
                break;
            }
        }

        if (vals[i] === null) {
            return {
                ok:false,
                msg: `failed to obtain token ${i}` + report
            };
        }
    }

    return {ok:true, msg:atk_a}
}
