function (ctx,args) { // cmd:""
    // Support script for scrape.
    // Uploads/deletes the data needed at runtime into the DB.

    let cmd = (args && args.cmd) ? args.cmd : "upload";

    const id = "scrape 2.0";

    function del() {
        return #db.r({_id: id});
    }

    function upload() {
        // project name signature RegEx pattern (double escaped)
        const pns = "[\\w\\(\\)_]+";

        return #db.us(
            // return #db.us(
            {_id: id},
            {
                _id: id,
                // version of the dataset, date +%Y%m%d%H%M
                data_ver: "202609172245",
                info: "scrape 2.0 runtime data",
                // about_cmds: ["about_us", "strategy", "description",
                //              "our_mission", "corporate_goals", "mission",
                //              "plan"],
                // news_cmds: ["news_posts", "blog", "news", "posts", "happening",
                //             "latest"],
                //dir_cmds: ["employees", "people", "personnel", "dir"],
                rx_dir_cmd: {xpr:`access .*:"(\\w+)"`},
                rx_pub_cmds: {xpr:`(\\w+) \\| (\\w+) \\|`, f:"g"},
                rx_pswd: {xpr:`calling this \\w* (\\w*)`},
                rx_cmd_key: {xpr:`Please .* with (\\w*):`},
                rxs_topic: [{xpr:`${pns}\\.${pns}`},
                            {xpr:`project (${pns})`},
                            {xpr:`work continues on (${pns})`},
                            {xpr:`(${pns}) in your mailbox`},
                            {xpr:`fake \\w+ for (${pns})`},
                            {xpr:`developments \\w+ (${pns})`},
                            {xpr:`launch of the (${pns})`},
                            {xpr:`(${pns}) announces beta testing`},
                            {xpr:`review of (${pns})`},
                            {xpr:`release date for (${pns})`},
                            {xpr:`report all \\w+ \\w+ (${pns})`}]
            }
        );
    }

    const fns = {del:del,
                 upload:upload};
    let r = fns[cmd] ?
        fns[cmd]() : [{ok:false, msg:`unknown command: ${cmd}`}];
    return {ok:r[0].ok ? true : false, msg:r};
}
