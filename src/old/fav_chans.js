function(context, args)
{
	function usage() {
		let v_maj = 1;
		let v_min = 0;

		let msg = `
*** ${context.this_script} v${v_maj}.${v_min} ***

INFO:
    Joins or leaves a few channels automatically
ARGS:
    j - join
    l - leave
`
		return msg;
	}

	const chans = ["0000", "2D24"];
	var fn;
	if (args.input == "j") {
		for ( let i = 0; i < chans.length; i++) {
			#ms.chats.join({channel:chans[i]});
		}
	} else if (args.input == "l") {
		for ( let i = 0; i < chans.length; i++) {
			#ms.chats.leave({channel:chans[i]});
		}
	} else {
		return {ok:false, msg:"bad input: " + args.input + "\n" + usage()};
	}

	return {ok:true};
}
