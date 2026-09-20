function (ctx,args) { // cmd:""
    // ::: The Utility :::
    //
    // A collection of small utility programs, selectable via the cmd argument.
    //
    // Author: JinnT
    //
    //
    // ::: Utilities :::
    //
    // cull ......... Cull a range of upgrades in inventory.
    // scan_sector .. Return contents of sector or list all sectors in SL.
    // xfer_all ..... Transfer all GC to target.
    //
    //
    // ::: History :::
    //
    // v1.0 [2026-09-15 Tue 22:33] Add sector scanner.
    // -------------------------------------------------------------------------
    // v1.2 [2026-09-15 Tue 23:50] Add xfer_all, intended to be used in macros
    // to stash GC to a safe loc.
    // -------------------------------------------------------------------------
    // v1.3 [2026-09-17 Thu 15:47]
    //
    // - scan_sector: Sector listing. Parameter sec<tartet_sector> is now
    // optional, and if not defined, the program will return a sector listing at
    // security level specified.
    //
    // - scan_sector: Result truncation scan_sector also supports list
    // truncation (from:<idx> n:<idx>).
    //
    // - scan_sector: Substring filter.
    // -------------------------------------------------------------------------
    // v1.4 [2026-09-17 Thu 23:17] In scan, treat args.n:0 same as null.
    // -------------------------------------------------------------------------
    // v1.5 [2026-09-18 Fri 17:33] Cull: cull a range of upgrades. Basically a
    // QOL wrapper for sys.cull.
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
    // sl     - security level (fs, hs, ms, ls, ns)
    // sec    - sector to scan
    // from   - (optional) return list starting at index
    // n      - (optional) return up to n number of entries
    // filter - (optional) filters results by substring
    function scan_sector(args) {
        if (!args.sl) {
            return mkr(false, "scan_sector needs args: sec, sl");
        }

        var r,
            sec = args.sec,
            sl = args.sl.toUpperCase(),
            n = args.n ? args.n : undefined;

        const sls = ["FS", "HS", "MS", "LS", "NS"];

        if(!sls.find(l => sl === l)) {
            return mkr(false, `unsupported sec level: ${sl}`);
        }

        const scan_seclvl = {
            FS(sec) { return #fs.scripts.fullsec({sector:sec}) },
            HS(sec) { return #fs.scripts.highsec({sector:sec}) },
            MS(sec) { return #fs.scripts.midsec({sector:sec}) },
            LS(sec) { return #fs.scripts.lowsec({sector:sec}) },
            NS(sec) { return #fs.scripts.nullsec({sector:sec}) }
        }

        // if not sec, only worry about returning the sector listing
        if (sec) {
            if (!(scan_seclvl[sl](null)).find(str => str === sec)) {
                return mkr(false, `SECTOR ${sec} is not in SECLEVEL [${sl}]`);
            }

            r = #ms.chats.join({channel:sec});
            if (!r.ok) {
                if (!r.msg.includes("already")) { return r; }
            }
        }

        r = scan_seclvl[sl](sec);

        #ms.chats.leave({channel:sec});
        if (l.is_def(r.ok) && !r.ok) { return r; }

        // final processing before return (range, filter, etc)
        r = r.slice(args.from, (args.from) ? (args.from+n) : n);
        if (args.filter) { r = r.filter(i => i.includes(args.filter)); }

        return mkr(
            true,
            `SECTOR ${sec} [${sl}]\n${"-".repeat(ctx.cols)}\n` + l.columnize(r)
        );
    }


    // ::: xfer_all :::
    // Transfer all funds to the tgt, primarily intended to use with priv_store
    // or (other secure location) defined in a macro to quickly stash away GC.
    function xfer_all(args) {
        return #ms.accts.xfer_gc_to(
            {to:args.to, amount:#hs.accts.balance(), memo:"stashing"});
    }


    // ::: cull_range :::
    // cull upgrades from - to, when you want a quick way to clean after run
    // the scriptor needs to be passed in as not to trigger a security warning
    // when running other commands in this script.
    // s - (scriptror) scriptor to run, (designed for #s.sys.cull)
    // from - (int) start of range
    // to - (int) end of range (inclusive)
    // confirm - (bool) confirm culling
    function cull_range(args) {
        args.i = [...Array(args.to+1).keys()].slice(args.from);
        return (args.s.call(args));
    }

    // ::: scan_k3ys :::
    // Check if there are new k3y values in inventory.
    function scan_k3ys () {
        let k3ys = #db.f({ _id:"k3ys"}).first()
        if (!k3ys) { return mkr(false, "no data :(") }

        let r = #hs.sys.upgrades({full:true}),
            old_k3ys = k3ys.v1.concat(k3ys.v2),
            inv_k3ys = r.filter(o => Object.keys(o).includes("k3y")),
            new_k3ys = inv_k3ys.filter(o => !old_k3ys.includes(o.k3y))

        r = new_k3ys.length > 0 ? ["`LNEW KEYS`"] : ["NO NEW KEYS"]
        new_k3ys.forEach(k => {
            r.push("`V" + `000${k.i}\``.slice(-4) +
                   " " + k.name +
                   `\`J ${k.k3y}\``)
        })

        return r
    }

    // ::: purge :::
    //
    // Takes a blacklist of unwanted items names and purges them from the
    // upgrades inventory. Doesn't touch items with index below the i specified.
    // s - the scriptror, presumably #s.sys.cull
    // l - the blacklist
    // from - purge from here, including item at this position
    // confirm - confirm purge
    function purge(args) {
        let r = #hs.sys.upgrades({full:true}),
            // only purge items below safe index
            g = r.filter(o => o.i >= args.from)

        g = g.filter(o => args.l.includes(o.name)) // filter out non-blacklisted
        g = g.map(o => o.i) // only keep the index numbers of things to purge
        args.i = g
        return args.s.call(args);
    }


    let cmds = {
        scan:scan_sector,
        xfer_all:xfer_all,
        cull:cull_range,
        scan_k3ys:scan_k3ys,
        purge:purge,
    };

    if (!l.is_func(cmds[args.cmd])) {
        return mkr(false, "invalid cmd: " + args.cmd);
    }
    return cmds[args.cmd](args);
}
