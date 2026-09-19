function (ctx, args) { // name:"k3y_v1,k3y_v2", rarity:1
    // scrape market for k3y values in k3y_vX listings

    let r = #fs.market.browse({name:args.name, rarity:args.rarity}),
        mkt_ids = [],
        k3ys = [];

    for (let i of r) {
        mkt_ids.push(i.i);
    }

    r = #fs.market.browse({i:mkt_ids});

    for (let i of r) {
        k3ys.push(i.upgrade.k3y);
    }

    k3ys = [ ...new Set(k3ys) ];

    return (k3ys);
}
