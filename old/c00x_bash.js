function(context, args)
{
	function usage() {
		let v_maj = 1;
		let v_min = 0;

		let msg = `\n
*** HELP ***

NAME:
    c00x_bash v${v_maj}.${v_min}

INFO:
    Unlock a c00x family lock. Currently supports c001 through c003.

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
    if (atk_r.includes("c002")) {
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
