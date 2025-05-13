import metaFunction from '../meta.js';

describe('Link meta.js', () => {
  it('should return the expected meta object', () => {
    const options = {}; // Example options, if metaFunction used them
    const meta = metaFunction(options);

    expect(meta).toBeDefined();
    expect(meta.applyHtmlTags).toBeInstanceOf(Array);
    expect(meta.applyHtmlTags).toEqual(['link']);
  });

  it('should return tags in lowercase', () => {
    const meta = metaFunction({});
    meta.applyHtmlTags.forEach(tag => {
      expect(tag).toBe(tag.toLowerCase());
    });
  });
}); 