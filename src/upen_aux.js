function (ctx,args) { // cmd:""
    // Support script for Unipen.
    // Uploads/deletes the data needed at runtime into the DB.


    let cmd = (args && args.cmd) ? args.cmd : "upload";

    const id = "Unipen 1.0";

    function del() {
        return #db.r({_id: id});
    }

    function upload() {
              // c00X colors
        const colors = ["orange", "red", "yellow", "blue",
                        "purple", "cyan", "lime", "green"],
              color_digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
              // EZ_XX unlock commands
              ez_cmds = ["open", "unlock", "release"],
              // EZ_35 digits
              ez_digits = color_digits,
              // EZ_40 primes
              // TODO not sure how many we actually need (guess 25), highest
              //      observed so far was 67
              ez_primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43,
                           47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97],
              // TODO not sure l0cket uses both v1 and v2 codes, test
              k3ys = [
                  // k3y_v1
                  "vc2c7q", "tvfkyq", "72umy0", "pmvr1q", "xwz7ja", "uphlaw",
                  // k3y_v2
                  "5c7e1r", "hc3b69", "vthf6e", "lq09tg", "4jitu5", "nyi5u2",
                  "voon2h", "j1aa4n"

              ],
              data_check_map = [
                  // user ++++++ provides instruction via script
                  {q:"instruct", a:"teach"}, // tested
                  // safety depends on the use of scripts.++++++
                  {q:"safet", a:"get_level"}, // tested
                  // a ++++++ is a household cleaning device with a rudimentary
                  {q:"+ is a house", a:"robovac"}, // tested
                  // user ++++++ uses the port epoch environment to request gc
                  {q:"t gc", a:"outta_juice"}, // tested
                  // communications issued by user ++++++ demonstrate structural
                  // patterns associated with humor
                  {q:"th humor", a:"sans_comedy"}, // tested
                  // pet, pest, plague and meme are accurate descriptors of the ++++
                  {q:"pet,", a:"bunnybat"}, // TODO test
                  // user 'on_th3_1ntern3ts' has ++++++ many things
                  {q:"th3_1", a:"heard"}, // tested
                  // "did you know is a communication pattern common to user ++
                  {q:"ion pa", a:"fran_lee"}, // tested
                  // service ++++++ provides atmospheric updates via the
                  {q:"atmo", a:"weathernet"}, // tested
                  // users gather in channel CAFE to share ++++++
                  {q:"CAFE", a:"poetry"} // TODO test
              ];


        return #db.us(
            // return #db.us(
            {_id: id},
            {
                _id: id,
                // version of the dataset, date +%Y%m%d%H%M
                data_ver: "202609182125",
                info: "Unipen 1.0 init data",

                // TODO I assume the ctx.this_scripts reference wont work, but let's see
                help_txt: `
NAME:
    Unipen

INFO:
    Unlock locks of a loc.

    Supported:
    CORE  ....... c001, c002, c003
    HALPERION  .. EZ_21, EZ_35, EZ_40

    Partially supported:
    Unknown ..... DATA_CHECK (partial, testing)
    Nuutec  ..... l0cket (partial, testing)

USAGE:
    script {tgt: <loc>}
    e.g. unipen { tgt: #s.bob_jr.un_cle6 }

ARGS:
    tgt - target loc scriptor e.g. #s.user.script
`,

                // I'm surprised this works for everything so far, surely I'll
                // need more of these in the future
                fsig: "not the",
                // lock signature regex patterns (double escaped '\')
                lsigs: [
                    {xpr: "`N(c00.)`"},   // CORE c00x family: c001, c002, ...
                    {xpr: "`N(EZ_..)`"},  // HALPERYON SYSTEMS EZ_x: EZ_21, EZ_35, ...
                    {xpr: "`N(l0\\w+)`"}, // l0cket, l0ckbox
                    {xpr: "`N(DAT\\w+)`"} // DATA_CHECK
                ],
                // unksig = {xpr:"Denied access by (.*) lock"},


                keys_dict: {
                    c001:{c001: colors,
                          color_digit: color_digits},
                    c002:{c002: colors,
                          c002_complement: colors},
                    c003:{c003: colors,
                          c003_triad_1: colors,
                          c003_triad_2: colors},
                    EZ_21:{EZ_21: ez_cmds},
                    EZ_35:{EZ_35: ez_cmds,
                           digit: ez_digits},
                    EZ_40:{EZ_40: ez_cmds,
                           ez_prime: ez_primes},
                    l0cket:{l0cket: k3ys},
                    DATA_CHECK:{DATA_CHECK: data_check_map}
                }
            }
        );
    }


    function dump() {
        return [{ok:true, msg: #db.f({_id:id}).first()}];
    }


    const fns = {del:del,
                 upload:upload,
                 dump:dump};
    let r = fns[cmd] ?
        fns[cmd]() : [{ok:false, msg:`unknown command: ${cmd}`}];
    return {ok:r[0].ok ? true : false, msg:r};
}
