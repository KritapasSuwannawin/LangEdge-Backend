import { expect } from 'chai';
import sinon from 'sinon';

import {
  determineLanguageAndCategory,
  translateTextAndGenerateSynonyms,
  generateSynonyms,
  generateExampleSentences,
} from '../../../src/infrastructure/services/llmService';
import { getLLM } from '../../../src/infrastructure/services/llmService/llmModels';

describe('LLM Functions', function () {
  let defaultLLM: ReturnType<typeof getLLM>;

  beforeEach(() => {
    defaultLLM = getLLM();
  });

  // Increase timeout for this test suite
  this.timeout(10000);

  describe('determineLanguageAndCategory', () => {
    // Test cases for valid inputs with expected language and category detection
    it('should correctly identify a single word in English', async () => {
      const result = await determineLanguageAndCategory('Hello');
      expect(result).to.not.be.null;
      expect(result).to.have.property('language', 'English');
      expect(result).to.have.property('category', 'Word');
    });

    it('should correctly identify a phrase in English', async () => {
      const result = await determineLanguageAndCategory('A little boy');
      expect(result).to.not.be.null;
      expect(result).to.have.property('language', 'English');
      expect(result).to.have.property('category', 'Phrase');
    });

    it('should correctly identify a sentence in English', async () => {
      const result = await determineLanguageAndCategory('The quick brown fox jumps over the lazy dog.');
      expect(result).to.not.be.null;
      expect(result).to.have.property('language', 'English');
      expect(result).to.have.property('category', 'Sentence');
    });

    it('should correctly identify a paragraph in English', async () => {
      const result = await determineLanguageAndCategory(
        `Language learning is a journey. It requires patience and consistent practice. Many people find it challenging, but the rewards of being able to communicate in another language make it worthwhile.`
      );
      expect(result).to.not.be.null;
      expect(result).to.have.property('language', 'English');
      expect(result).to.have.property('category', 'Paragraph');
    });

    it('should correctly identify text in a non-English language', async () => {
      const result = await determineLanguageAndCategory('Bonjour');
      expect(result).to.not.be.null;
      expect(result).to.have.property('language', 'French');
      expect(result).to.have.property('category', 'Word');
    });

    // Test cases for invalid inputs
    it('should return error for meaningless input', async () => {
      const result = await determineLanguageAndCategory('asdfghjkl qwertyuiop zxcvbnm');
      expect(result).to.not.be.null;
      expect(result).to.have.property('errorMessage', 'Invalid input');
    });

    it('should return error for random characters', async () => {
      const result = await determineLanguageAndCategory('!@#$%^&*()_+');
      expect(result).to.not.be.null;
      expect(result).to.have.property('errorMessage', 'Invalid input');
    });

    // Edge cases
    it('should handle empty string input', async () => {
      const result = await determineLanguageAndCategory('');
      expect(result).to.not.be.null;
      expect(result).to.have.property('errorMessage', 'Invalid input');
    });

    // Error handling
    it('should return null when an error occurs', async () => {
      const mockLLM = defaultLLM;
      mockLLM.call = sinon.stub().throws(new Error('Test error'));

      const result = await determineLanguageAndCategory('Hello', mockLLM);
      expect(result).to.be.null;
    });
  });

  describe('translateTextAndGenerateSynonyms', () => {
    // Basic translation without synonyms
    it('should translate text from English to Spanish without synonyms', async () => {
      const result = await translateTextAndGenerateSynonyms('Eat', false, 'English', 'Spanish');
      expect(result).to.not.be.null;
      expect(result).to.have.property('translation').that.is.a('string');
      expect(result).to.have.property('synonyms').that.is.an('array').that.is.empty;
    });

    // Translation with synonyms
    it('should translate text from English to Spanish with synonyms', async () => {
      const result = await translateTextAndGenerateSynonyms('Eat', true, 'English', 'Spanish');
      expect(result).to.not.be.null;
      expect(result).to.have.property('translation').that.is.a('string');
      expect(result).to.have.property('synonyms').that.is.an('array').that.is.not.empty;
      expect(result!.synonyms.length).to.be.at.least(3).and.at.most(5);
    });

    // Non-English source language without synonyms
    it('should translate from Spanish to English without synonyms', async () => {
      const result = await translateTextAndGenerateSynonyms('comer', false, 'Spanish', 'English');
      expect(result).to.not.be.null;
      expect(result).to.have.property('translation').that.is.a('string');
      expect(result).to.have.property('synonyms').that.is.an('array').that.is.empty;
    });

    // Non-English source language with synonyms
    it('should translate from Spanish to English with synonyms', async () => {
      const result = await translateTextAndGenerateSynonyms('comer', true, 'Spanish', 'English');
      expect(result).to.not.be.null;
      expect(result).to.have.property('translation').that.is.a('string');
      expect(result).to.have.property('synonyms').that.is.an('array').that.is.not.empty;
      expect(result!.synonyms.length).to.be.at.least(3).and.at.most(5);
    });

    // Error handling
    it('should return null when an error occurs', async () => {
      const mockLLM = defaultLLM;
      mockLLM.call = sinon.stub().throws(new Error('Test error'));

      const result = await translateTextAndGenerateSynonyms('Hello', false, 'English', 'Spanish', mockLLM);
      expect(result).to.be.null;
    });
  });

  describe('generateSynonyms', () => {
    // Basic functionality
    it('should generate synonyms for an English word', async () => {
      const result = await generateSynonyms('Happy', 'English');
      expect(result).to.not.be.null;
      expect(result).to.be.an('array').that.is.not.empty;
      expect(result!.length).to.be.at.least(3).and.at.most(5);
    });

    // Non-English language
    it('should generate synonyms for a non-English word', async () => {
      const result = await generateSynonyms('heureux', 'French');
      expect(result).to.not.be.null;
      expect(result).to.be.an('array').that.is.not.empty;
      expect(result!.length).to.be.at.least(3).and.at.most(5);
    });

    // Error handling
    it('should return null when an error occurs', async () => {
      const mockLLM = defaultLLM;
      mockLLM.call = sinon.stub().throws(new Error('Test error'));

      const result = await generateSynonyms('Happy', 'English', mockLLM);
      expect(result).to.be.null;
    });
  });

  describe('generateExampleSentences', () => {
    // Basic functionality
    it('should generate example sentences from English to Spanish', async () => {
      const result = await generateExampleSentences('happy', 'English', 'Spanish');
      expect(result).to.not.be.null;
      expect(result).to.be.an('array').with.lengthOf(3);
      result!.forEach((item) => {
        expect(item).to.have.property('sentence').that.is.a('string').and.not.empty;
        expect(item).to.have.property('translation').that.is.a('string').and.not.empty;
      });
    });

    // Non-English source language
    it('should generate example sentences from Spanish to English', async () => {
      const result = await generateExampleSentences('feliz', 'Spanish', 'English');
      expect(result).to.not.be.null;
      expect(result).to.be.an('array').with.lengthOf(3);
      result!.forEach((item) => {
        expect(item).to.have.property('sentence').that.is.a('string').and.not.empty;
        expect(item).to.have.property('translation').that.is.a('string').and.not.empty;
      });
    });

    // Error handling
    it('should return null when an error occurs', async () => {
      const mockLLM = defaultLLM;
      mockLLM.call = sinon.stub().throws(new Error('Test error'));

      const result = await generateExampleSentences('happy', 'English', 'Spanish', mockLLM);
      expect(result).to.be.null;
    });
  });
});
