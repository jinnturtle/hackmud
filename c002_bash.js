function(context, args)
{
// Should unlock a c002, perhaps can be made universal for the c00x family in
// the future.

	function usage() {
		let v_maj = 1;
		let v_min = 0;

		let msg = `\n
*** HELP  ***

NAME:
    c002_bash v${v_maj}.${v_min}
INFO:
    Unlock a c002
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
    }

    var report = "";
    var f_sig = "is not" // fail signature
    var atk_a = {}, atk_r;
    function atk() {
        atk_r = args.tgt.call(atk_a);
        report += atk_r;
    }

    atk();
    if (atk_r.includes("c002")) {
        var t1 = null; // first token
        for (let i = 0; i < colors.length; i++) {
            atk_a = {c002:colors[i]};
            atk();
            if (!atk_r.includes(f_sig)) {
                t1 = colors[i];
                break;
            }
        }

        if (t1 === null) {
            return {
                ok:false,
                msg: "failed to obtain token 1\n\n" + atk_r + "\n\nREPORT\n\n" + report
            };
        }

        for (let i = 0; i < colors.length; i++) {
            atk_a = {c002:t1, c002_complement:colors[i]};
            atk();
            if (!atk_r.includes(f_sig)) {
                return {ok:true, msg:`t1: ${t1} t2: ${colors[i]}`}
            }
        }

        if (t1 === null) {
            return {
                ok:false,
                msg: "failed to obtain token 2\n\n" + atk_r + "\n\nREPORT\n\n" + report
            };
        }
    }

    return usage();
}
