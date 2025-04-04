// 现代汉语常用字表（简化版示例）
const faker = {}
const commonChineseChars = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感';

faker.randomChinese = (len) => {
  let result = '';
  for (let i = 0; i < len; i++) {
    const randomIndex = Math.floor(Math.random() * commonChineseChars.length);
    result += commonChineseChars[randomIndex];
  }
  return result;
}

module.exports = { faker }