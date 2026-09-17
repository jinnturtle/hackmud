function (context,args) { // s:#s.user.script, t0:#s.u.s, t1:#s.u.s t2:#s.u.s, t3:#s.u.s
    const l = #fs.scripts.lib();

    var r = [];

    var s = args.s; // script
    var t = []; // targets

    // TODO error check the args


    for (let i = 0; i < 4; i++) {
        if (l.is_def(args["t"+i])) {
            t.push(args["t"+i]);
        }
    }

    var r = []; // results

    function fef(item, idx) {
        r.push(s.call({t:item}));
    }

    t.forEach(fef);

    return r;
}
