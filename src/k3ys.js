function (ctx, args) { // cmd:""
    // scrape market for k3y values in k3y_vX listings

    if (!args || !args.cmd ) { return {ok:false, msg:"no cmd"} };

    // NB: don't forget to download to relevant tools when you upload
    const k3ys = {
        _id:"k3ys",
        v1:[
            // k3y_v1
            // "vc2c7p", "tvfkyq", "uphlaw" occur pretty often is seems
            // so putting them in front
            "vc2c7q", "tvfkyq", "uphlaw", "72umy0", "pmvr1q", "xwz7ja",
            "eoq6de", "cmppiq", "sa23uw",
        ],
        v2:[
            // k3y_v2
            "5c7e1r", "hc3b69", "vthf6e", "lq09tg", "4jitu5", "nyi5u2",
            "voon2h", "j1aa4n"
        ]};

    // scan market for k3y value
    // name:"k3y_v1,k3y_v2", rarity:1s
    // TODO alert if new value is found
    function scan_market() {
        if (!args.name) { return {ok:false, msg:"need name of k3y"} }
        if (!["k3y_v1", "k3y_v2"].includes(args.name)) {
            return {ok:false, msg:`bad name: ${args.name}`}
        }

        let r = #fs.market.browse({name:args.name}),
            mkt_ids = [],
            mkt_k3ys = [];

        for (let i of r) {
            mkt_ids.push(i.i);
        }

        r = #fs.market.browse({i:mkt_ids});

        for (let i of r) {
            mkt_k3ys.push(i.upgrade.k3y);
        }

        mkt_k3ys = [ ...new Set(mkt_k3ys) ];

        let my_k3ys = k3ys.v1.concat(k3ys.v2),
            new_k3ys = [];
        mkt_k3ys.forEach(k => {
            if (!my_k3ys.includes(k)) {new_k3ys.push(`\`L${k}\``)};
        })

        return [
            mkt_k3ys,
            [new_k3ys.length > 0 ? "\n`LNEW K3YS!!!`" : ""],
            new_k3ys];
    }

    switch (args.cmd) {
    case "purge":
        if (!args.confirm) { return {ok:false, msg:"confirm:true to purge"} }
        return  #db.r({_id:k3ys._id})

    case "upload":
        return #db.us(
            {_id:k3ys._id},
            k3ys
        );

    case "dump":
        return #db.f({_id:k3ys._id}).first()

    case "scan_market":
        return scan_market();

    default:
        return {ok:false, msg:`unknown cmd: ${args.cmd}`}
    }

}
