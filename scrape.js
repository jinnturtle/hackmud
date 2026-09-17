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
    // v - verbose mode (outputs a fairly detailed log)
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

    // TODO reduce char count to below 2000
    //      - move consts to DB.
    //      - comment out logging, not needed if not debugging.
    //      - standartise informational messages and move values to DB.
    //      - consider removing checks if(ttb()) { return mkr(false,""); }
    //        from all/most places they're mostly for DEV.
    // TODO consider moving the decorruptor to a lib.

    // password keys: password, pass

    const l = #fs.scripts.lib(),
          tthr = 500, // timeout threshold, bail if less than this
          timewrn = "`DTIMEOUT`", // text to display if quit due to timeout
          about_cmds = ["about_us", "strategy", "description", "our_mission",
                        "corporate_goals", "mission"],
          news_cmds = ["news_posts", "blog", "news", "posts", "happening",
                       "latest"],
          dir_cmds = ["employees", "people", "personnel", "dir"],
          passwd_regx = /calling this \w* (\w*)/,
          cmd_key_regx = /Please .* with (\w*):/,
//          dir_topics = ["Free_BFG"],
          regxes = [/\w+\.\w+/,
                    /\w+_\w+/,
                    /project ([\w\(\)_]+)/,
                    /work continues on ([\w\(\)_]+)/,
                    /([\w\(\)_]+) in your mailbox/,
                    /fake \w+ for ([\w\(\)_]+)/,
                    /developments \w+ ([\w\(\)_]+)/,
                    /launch of the ([\w\(\)_]+)/,
                    /([\w\(\)_]+) announces beta testing/,
                    /review of ([\w\(\)_]+)/,
                    /release date for ([\w\(\)_]+)/,
                    /report all \w+ \w+ ([\w\(\)_]+)/] ;
    var timeout = false;


    function log(msg) {
        if(args.v) { l.log(msg); }
    }

    // TODO temporary, send debug via chat
    function sd(msg) {
        #fs.chats.send({name:"jinndbg", msg:msg});
    }

    // time to live - how much time the program still has before server kills it
    function ttl() {
        return _END - Date.now();
    }

    // time to bail?
    function ttb() {
        timeout = !l.can_continue_execution(tthr);
        return timeout;
    }

    // make a standard returnable object
    function mkr(ok, msg) {
        if (timeout) { msg = timewrn + "\n" + msg; }
        return {ok:ok, msg:[msg, l.get_log().join("\n")]};
    }

    // decorrupt output of callable target, increase np for better output
    function decorrupt(t, args, np = 2) {
        // sd(`TTL:${ttl()}`);
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


    // log();log();log("*** LOG ***");

    // if(ttb()) { return mkr(false,""); }
    var r = decorrupt(args.tgt);

    var about_cmd = l.is_str(r) ? about_cmds.find(s => r.includes(s)) : 0;
    // log(`about_cmd: ${about_cmd}`);
    if (!about_cmd) { return mkr(false, ["about cmd?", r]); }

    var news_cmd = l.is_str(r) ? news_cmds.find(s => r.includes(s)) : 0;
    // log(`news_cmd: ${news_cmd}`);
    if (!news_cmd) { return mkr(false, ["news cmd?", r]); }

    // if(ttb()) { return mkr(false,""); }
    r = decorrupt(args.tgt, {});
    // log(`call({}): ${r}`)

    var dir_cmd = l.is_str(r) ? dir_cmds.find(s => r.includes(s)) : 0;
    // log(`dir_cmd: ${dir_cmd}`);
    if (!dir_cmd) { return mkr(false, ["directory cmd?", r]); }

    var cmd_key = cmd_key_regx.exec(r);
    // TODO commented due to char count, useful code otherwise (error checking)
    // if (!cmd_key) { return mkr(false, ["cmd key?", r]); }
    cmd_key = (cmd_key) ? cmd_key.pop() : 0;
    // log(`cmd_key: ${cmd_key}`);

    var pld = {};
    pld[cmd_key] = about_cmd;
    // if(ttb()) { return mkr(false,""); }
    r = decorrupt(args.tgt, pld);
    // log(`call(${JSON.stringify(pld)}): ${r}`)
    var passwd = passwd_regx.exec(r);
    // TODO commented due to char count, useful code otherwise (error checking)
    // if (!passwd) { return mkr(false, ["passwd?", pld, r])};
    passwd = passwd.pop();
    // log(`passwd: ${passwd}`);


    // TODO won't be needed when this is done, also "password", can be "pass"
    // var rmsg = `${args.tgt.name}{${cmd_key}:"${news_cmd}"}\n`
    // rmsg += `${args.tgt.name}{${cmd_key}:"${dir_cmd}", password:"${passwd}"}`;
    // return mkr(true, rmsg);


    pld[cmd_key] = news_cmd;
    // log("[pld] " + JSON.stringify(pld));
    // TODO decorrupt already stringifies, perhaps remove redundancy
    // r = JSON.stringify(decorrupt(args.tgt, pld));
    r = decorrupt(args.tgt, pld);

    let dir_topics = [];

    for(let rx of regxes) {
        for (let item of r) {
            // if(ttb()) { return mkr(false, ""); }
            let c = rx.exec(item);
            // expecintg regexes to be such that the last element is the target
            if (c) {
                dir_topics.push(c.pop());
                // TODO if we break out of the loop here, finds way less uniques
                // items, not sure why, investigate
                //
                // break;
            }
        }
    }

    dir_topics = [ ...new Set(dir_topics) ];

    r = [];
    for (let tpc of dir_topics) {
        if(ttb()) { return mkr (false, ""); }
        pld[cmd_key] = dir_cmd;
        pld.password = passwd;
        pld.pass = passwd;
        pld.project = tpc;

        // if(tt() < 1500) {sd(`TTL:${ttl()} TP:${topic}`)};
        // sd(`TTL:${ttl()} TP:${topic}`);
        r.push({topic:tpc, locs:decorrupt(args.tgt, pld)});
    }

    // TODO report false-positives along source text for finetuning
    //
    // cleaning out false-positive returns (front page should contian news or
    // about cmd)
    var locs = [];
    for (let i = 0; i < r.length; i++) {
        if(r[i].locs.includes(news_cmd)) { r[i] = ""; }
        else { locs.push(r[i].locs); }
    }

    log(`\`FTTL\`: ${_END - Date.now()}`);
    // return mkr(true, r);
    return mkr(true, locs);
}
