/* Where every photograph in assets/photos/ came from. The builder's drafts use them (see data/trades.js).
   Pexels photos are free for commercial use with no attribution required; they are credited here anyway.
   `hero` is <trade>.webp and <trade>-sm.webp, `second` is <trade>-2.webp. */
const px = (id, by) => ({ source: 'Pexels', id, by, url: `https://www.pexels.com/photo/${id}/` });
module.exports = {
  heating:    { hero: px(7859953, 'Heiko Ruth'),            second: px(12644994, 'BOOM Photography') },
  electrical: { hero: px(17842832, 'Fatih Yurtman'),        second: px(17924298, 'Fatih Yurtman') },
  roofing:    { hero: px(31762405, 'Gundula Vogel'),        second: px(15964928, 'David Brown') },
  building:   { hero: { source: 'Kingpost demo build (showcase repo, kingpost/assets/work-2.jpg)', by: 'not recorded' },
                second: { source: 'Kingpost demo build (showcase repo, kingpost/assets/work-1.jpg)', by: 'not recorded' } },
  kitchens:   { hero: px(33257995, 'Brett Jordan'),         second: px(19666087, 'Alexander F Ungerer') },
  garden:     { hero: px(37028020, 'Neville Hawkins'),      second: px(25972319, 'Enrique') },
  cleaning:   { hero: px(5591903, 'RDNE Stock project'),    second: px(4239037, 'Kaboompics') },
  salon:      { hero: px(3993320, 'cottonbro studio'),      second: px(7750124, 'Max Vakhtbovych') },
  garage:     { hero: px(8478259, 'Sergey Meshkov'),        second: px(8986132, 'Artem Podrez') },
  handyman:   { hero: px(1249614, 'Bidvine'),               second: px(4496282, 'Sonny Sixteen') },
};
