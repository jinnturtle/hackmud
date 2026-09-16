function (ctx,args) { // tgt:#s.user.scr
    // ::: SCRAPER :::
    //
    // Takes a scriptor as target (e.g. #s.username.public), returns the locs it
    // can find there.
    //
    // WIP - for now only returns the nav key, directory, and password
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

    // TODO consider moving the decorruptor to a lib.

    // password keys: password, pass

    const l = #fs.scripts.lib(),
          about_cmds = ["about_us", "strategy", "description", "corporate_goals"],
          news_cmds = ["blog", "news", "posts", "news_posts"],
          dir_cmds = ["employees", "people", "personnel"],
          passwd_regx = /calling this \w* (\w*)/,
          cmd_key_regx = /Please .* with (\w*):/;


    function log(msg) {
        if(args.v) { l.log(msg); }
    }

    // make a standard returnable object
    function mkr(ok, msg) {
        return {ok:ok, msg:msg + l.get_log().join("\n")};
    }

    // decorrupt output of callable target
    function decorrupt(t, args) {
        const cc = l.corruption_chars,
              rc = cc[0], // replacement char for corruption decolorisation
              cregx = new RegExp(`\`[${l.colors}][${cc}]\``, "g");
        let s = "", // buffer for return text
            ok = true;

        let a = t.call(args);
        // remove colors to avoid alignment issues when scanning/replacing
        a = a.replace(cregx, rc);

        do {
            let b = t.call(args);
            b = b.replace(cregx, rc);

            for (let i = 0; i < a.length ; i++) {
                s += (a[i] === rc) ? b[i] : a[i];
                if (s[i] === rc) { ok = false; }
            }
        } while (!ok);

        return s;
    }

    log();log();log("*** LOG ***");

    var r = decorrupt(args.tgt);

    var about_cmd = about_cmds.find(s => r.includes(s));
    log(`about_cmd: ${about_cmd}`);
    if (!about_cmd) { return mkr(false, "did not find about cmd"); }

    var news_cmd = news_cmds.find(s => r.includes(s));
    log(`news_cmd: ${news_cmd}`);
    if (!news_cmd) { return mkr(false, "did not find posts cmd"); }

    r = decorrupt(args.tgt, {});
    log(`call({}): ${r}`)

    var dir_cmd = dir_cmds.find(s => r.includes(s));
    log(`dir_cmd: ${dir_cmd}`);
    if (!dir_cmd) { return mkr(false, "did not find directory cmd"); }

    var cmd_key = cmd_key_regx.exec(r).pop();
    log(`cmd_key: ${cmd_key}`);

    var pld = {};
    pld[cmd_key] = about_cmd;
    r = decorrupt(args.tgt, pld);
    log(`call(${JSON.stringify(pld)}): ${r}`)
    var passwd = passwd_regx.exec(r).pop();
    log(`passwd: ${passwd}`);


    // TODO won't be needed when this is done, also "password", can be "pass"
    var rmsg = `${args.tgt.name}{${cmd_key}:"${news_cmd}"}\n`
    rmsg += `${args.tgt.name}{${cmd_key}:"${dir_cmd}", password:"${passwd}"}`;
    return mkr(true, rmsg);
}
