function (ctx,args) { // tgt:#s.user.scr
    // ::: SCRAPER :::
    //
    // Takes a scriptor as target (e.g. #s.username.public), returns the locs it
    // can find there.
    //
    //
    // ::: USAGE :::
    //
    // tgt - target to scrapte
    //
    // Runtime data needs to me initialised by an auxiliary (scrape_aux)
    // program. E.g. user.scrape_aux(cmd:"upload").
    //
    //
    // ::: HISTORY :::
    //
    // v0.1 - WIP collects the dirrectory password and nav commands, but does
    // not yet find means to read the locs automatically. Still useful to things
    // automate a bit.
    // -------------------------------------------------------------------------
    // v1.0 - Returns a list of locs found scraping a supplied target scriptor.
    // -------------------------------------------------------------------------
    // v2.0 - Now storing most of runtime data in aux DB. Some optimisations and
    // cosmetic output changes.
    // -------------------------------------------------------------------------
    // v2.1 - Sorting the output by known loc types (jr, dd, wb, ...)
    // -------------------------------------------------------------------------

    // TODO add sort option (by [jr, dd, wb, ...], and maybe [ttl, wlf, ...] )
    // TODO reduce char count to below 2000
    //      - standartise informational messages and move values to DB.
    // TODO consider moving the decorruptor to a lib.


    // DATA --------------------------------------------------------------------

    const l = #fs.scripts.lib(),
    // program data
          pd = #db.f({_id:"scrape 2.0"}).first();


    // FUNC --------------------------------------------------------------------

    // TODO used in Unipen too, should be moved to a lib
    // make a RegExp out of string data {xpr:<expression>, f:<flags>}
    function s2rx(d) {
        return new RegExp(d.xpr, d.f);
    }

    // TODO a good candidate to be moved to a general library
    // TODO temporary, for debug, send a message via chat
    // send to chat - send a message to chat
    // function stc(name, msg) {
    //     #fs.chats.send({name:name, msg:msg});
    // }

    // TODO a good candidate to be moved to a general library
    // time to live - how much time the program still has before server kills it
    // function ttl() {
    //     return _END - Date.now();
    // }

    // TODO a good candidate to be moved to a general library
    // time to bail?
    // function ttb() {
    //     timeout = (tthr > ttl());
    //     return timeout;
    // }

    // make a standard returnable object
    function mkr(ok, msg) {
        // if (timeout) { msg = "`DTIMEOUT`" + "\n" + msg; }
        // return {ok:ok, msg:[msg, l.get_log().join("\n")]};
        return {ok:ok, msg:[msg]};
    }

    // decorrupt output of callable target, increase np for better output
    function decorrupt(t, args, np = 2) {
        // TODO cregx and cc could be grabbed from DB to reduce char count
        //      , rc is fine as is. Perhaps should not handle here if it's
        //      going into a library.
        const cc = l.corruption_chars,
              rc = cc[0], // replacement char for corruption decolorisation
              cregx = new RegExp(`\`[${l.colors}][${cc}]\``, "g");
        let ok = true;

        let a = t.call(args);
        let is_str = l.is_str(a);
        if (!is_str) {
            a = JSON.stringify(a);
        }

        // remove colors to avoid alignment issues when scanning/replacing
        a = a.replace(cregx, rc);

        do {
            np--;
            ok = true;
            let b = t.call(args);
            if (!is_str) { b = JSON.stringify(b); }
            b = b.replace(cregx, rc);

            let s = "";
            for (let i = 0; i < a.length ; i++) {
                s += (a[i] === rc) ? b[i] : a[i];
                if (s[i] === rc) { ok = false; }
            }
            a = s;
        } while (!ok && np);

        if (!is_str) {a = JSON.parse(a)};
        return a;
    }


    // MAIN --------------------------------------------------------------------

    if (!pd) { return mkr(false, "bad data") };

    // replace data entries with regex objecs make out of said data
    // somewhat of an atrocity, but saves precious char space
    for (let key in pd) {
        if (pd[key].xpr) { pd[key] = s2rx(pd[key]); }
    }
    pd.rxs_topic = pd.rxs_topic.map(v => s2rx(v));

    var r = decorrupt(args.tgt);

    // regex here is risky, as it can fail if the order or the separator changes
    // as we rely on popping the regex result array in a specific order, but
    // seems that t1 corps allways have the same order, and this is compact
    var pub_cmds = pd.rx_pub_cmds.exec(r);
    var about_cmd = pub_cmds.pop();
    if (!about_cmd) { return mkr(false, ["about cmd?", r]); }

    var news_cmd = pub_cmds.pop();
    if (!news_cmd) { return mkr(false, ["news cmd?", r]); }
    r = decorrupt(args.tgt, {});

    // var dir_cmd = l.is_str(r) ? pd.dir_cmds.find(s => r.includes(s)) : 0;
    // var dir_cmd = /access .*:"(\w+)"/.exec(r);
    var dir_cmd = pd.rx_dir_cmd.exec(r);
    if (!dir_cmd) { return mkr(false, ["directory cmd?", r]); }
    dir_cmd = (dir_cmd) ? dir_cmd.pop() : 0;

    var cmd_key = pd.rx_cmd_key.exec(r);
    if (!cmd_key) { return mkr(false, ["cmd key?", r]); }
    cmd_key = (cmd_key) ? cmd_key.pop() : 0;

    var pld = {};
    pld[cmd_key] = about_cmd;
    r = decorrupt(args.tgt, pld);

    var passwd = pd.rx_pswd.exec(r);
    if (!passwd) { return mkr(false, ["passwd?", pld, r])};
    passwd = passwd.pop();

    pld[cmd_key] = news_cmd;
    r = decorrupt(args.tgt, pld);

    let dir_topics = [];

    for(let rx of pd.rxs_topic) {
        for (let item of r) {
            let c = rx.exec(item);
            // expecintg regexes to be such that the last element is the target
            if (c) { dir_topics.push(c.pop()); }
        }
    }

    dir_topics = [ ...new Set(dir_topics) ];

    r = [];
    for (let tpc of dir_topics) {
        pld[cmd_key] = dir_cmd;
        pld.password = passwd;
        pld.pass = passwd;
        pld.p = passwd;
        pld.project = tpc;

        r.push({topic:tpc, locs:decorrupt(args.tgt, pld)});
    }

    // TODO report false-positives along source text for finetuning
    // TODO is there a more compact way to do this, e.g. using .map()?
    //
    // cleaning out false-positive returns (front page should contian news or
    // about cmd)
    let locs = {jr:[], dd:[], wb:[], oth:[]};
    for (let i = 0; i < r.length; i++) {
        if (!r[i].locs.includes(news_cmd)) { // filter out the false positives
            for (let loc of r[i].locs) { // each positive resp is array of strs
                for (let key in locs) { // sort by jr, dd, ..., other
                    if (loc.includes(key)) {
                        locs[key].push(loc);
                        break;
                    }
                    // oth is last, loc is uncathegorised if we got this far
                    if (key === "oth") {
                        locs.oth.push(loc);
                    }
                }
            }
        }
    }

    var cinf = `${args.tgt.name}{${cmd_key}:"${news_cmd}"}\n`;

    // log(`\`FTTL\`: ${_END - Date.now()}`);
    return mkr(true, [cinf, args.tgt.name + JSON.stringify(pld), locs]);
}
