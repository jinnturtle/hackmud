function (context,args) {
    // testing a bot brain

    var r = [];

    r.push(#ms.chats.join({channel:"JINN", password:"bunny2"}));
    r.push(#fs.chats.send({channel:"JINN", msg:"braindance"}));

    r.push(#ms.kernel.hardline());

    // r.push(#fs.cult.t1_cracker({t:"#s.abandoned_jrstg_pmvbid.external_5aziyj"}));
    // r.push(#fs.cult.t1_cracker({t:"#s.abandoned_jrttl_fxtr70.info_2e9id7"}));
    // r.push(#fs.cult.t1_cracker({t:"#s.abandoned_jrttl_qm0kw0.extern_8jf1lk"}));
    // r.push(#fs.cult.t1_cracker({t:"#s.abandoned_jrttl_s9nhuj.info_e0xux0"}));

    r.push(#ms.kernel.hardline({dc:true}));

    return r;

}
