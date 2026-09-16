function (ctx,args) { // cmd:"command", args:""
    // ::: The Utility :::
    //
    // A collection of small utility programs, selectable via the cmd argument.
    //
    // Author: JinnT
    //
    //
    // ::: History :::
    //
    // v1.0 [2026-09-15 Tue 22:33] - Added sector scanner.
    // -------------------------------------------------------------------------
    // v1.2 [2026-09-15 Tue 23:50] - Added xfer_all, intended to be used in
    // macros to stash GC to a safe loc.
    // -------------------------------------------------------------------------

    // TODO IDEA Would be nice to truncate or page a list that comes from
    // scripts.<fullsec, etc>, probably can be done via a small modification to
    // scan_sector().

    // Libs
    const l = #fs.scripts.lib();


    // Make a nice return object
    function mkr(ok, msg) {
        return {ok:ok, msg:msg};
    }

    // ::: scan_sector :::
    // Return contents of a sector
    function scan_sector(args) {
        if (!l.is_def(args.sec) || !l.is_def(args.sl)) {
            return mkr(false, "scan_sector needs args: sec, sl");
        }

        var r,
            sec = args.sec,
            sl = args.sl.toUpperCase();

        const scan_seclvl = {
            FS(sec) { return #fs.scripts.fullsec({sector:sec}) },
            HS(sec) { return #fs.scripts.highsec({sector:sec}) },
            MS(sec) { return #fs.scripts.midsec({sector:sec}) },
            LS(sec) { return #fs.scripts.lowsec({sector:sec}) },
            NS(sec) { return #fs.scripts.nullsec({sector:sec}) }
        }

        if (!(scan_seclvl[sl](null)).find((str) => str === sec)) {
            return mkr(false, `SECTOR ${sec} is not in SECLEVEL [${sl}]`);
        }

        r = #ms.chats.join({channel:sec});
        if (!r.ok) {
            if (!r.msg.includes("already")) { return r; }
        }

        r = scan_seclvl[sl](sec);
        if(!l.is_def(r)) { r = mkr(false, `unsupported sec level: ${sl}`); }

        #ms.chats.leave({channel:sec});

        if (l.is_def(r.ok) && !r.ok) { return r; }

        return mkr(
            true,
            `SECTOR ${sec} [${sl}]\n${"-".repeat(ctx.cols)}\n` +
                l.columnize(r));
    }


    // ::: xfer_all :::
    // Transfer all funds to the tgt, primarily intended to use with priv_store
    // or (other secure location) defined in a macro to quickly stash away GC.
    function xfer_all(args) {
        return #ms.accts.xfer_gc_to(
            {to:args.to, amount:#hs.accts.balance(), memo:"stashing"});
    }


    let cmds = {
        scan:scan_sector,
        xfer_all:xfer_all
    };

    return cmds[args.cmd](args);
}
