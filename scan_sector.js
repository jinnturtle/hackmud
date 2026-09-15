function (context,args) { // sector:"target"
    // hidden args:
    //     - v:bool : (verbose) enable detailed logging (mainly for dev needs)

    // libs
    const l = #fs.scripts.lib();


    // call wrappers
    const chats_join = {
        n: "chats.join",
        f(args) { return #ms.chats.join(args); }
    }

    const chats_leave = {
        n: "chats.leave",
        f(args) { return #ms.chats.leave(args); }
    }

    const scripts_fullsec = {
        n: "scripts.fullsec",
        f(args) { return #hs.scripts.fullsec(args); }
    }

    // -------------------------------------------------------------------------

    var sec = args.sector;
    const txt_line = "----------------------------------------";

    var log = {
        data: "",
        add(data) {
            if (args.v) {
                log.data += "\n" + data;
            }
        }
    }

    log.add("\n*** LOG ***\n");
    log.add(`args: ${JSON.stringify(args)}`);

    function call(tgt, args) {
        var retv = {ok:true, msg:"", r:null};
        retv.r = tgt.f(args);

        if (l.is_bool(retv.r.ok)) { retv.ok = retv.r.ok; }
        if (l.is_str(retv.r.msg)) { retv.msg += retv.r.msg; }

        log.add("\n" + txt_line +
                `\n${tgt.n}(${JSON.stringify(args)})` +
                `\n${JSON.stringify(retv.r)}`)

        return retv;
    }

    var r;
    r = call(chats_join, {channel: sec});
    if (!r.ok && !r.msg.includes("already in")) {
        return {ok: r.ok, msg: r.msg + log.data};
    }

    r = call(scripts_fullsec, {sector: sec});
    if (!r.ok) { return {ok: r.ok, msg: r.msg + log.data}; }

    var count = r.r.length;
    var body = `Sector: ${sec} Items: ${count}\n${txt_line}\n`
        + l.columnize(r.r);

    r = call(chats_leave, {channel: sec});
    if (!r.ok) { return {ok: r.ok, msg: r.msg + log.data}; }

    return {ok:true, msg:body + log.data};
}
