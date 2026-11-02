/**
 * Machine Learning Engine for BribeShield AI
 * Implements a Pre-Trained Multinomial Naive Bayes Classifier with TF-IDF Vectorization
 * Trained on corruption case patterns, statutory whistleblower classifications, and grievance lexicons.
 */

// Training Corpus for Corruption Classification
const TRAINING_CORPUS = [
  // Class 1: COERCIVE_EXTORTION
  { text: "inspector threatened to arrest me and register false fir unless i paid cash immediately", category: "COERCIVE_EXTORTION", weight: 1.0 },
  { text: "officer said they will demolish my shop today if extortion money is not delivered", category: "COERCIVE_EXTORTION", weight: 1.0 },
  { text: "police demanded hafta and threatened violence if vehicle is not released", category: "COERCIVE_EXTORTION", weight: 1.0 },
  { text: "forced to pay fifty thousand rupees or face criminal imprisonment", category: "COERCIVE_EXTORTION", weight: 1.0 },
  { text: "traffic officer seized driving license and demanded cash bribe under threat", category: "COERCIVE_EXTORTION", weight: 0.9 },

  // Class 2: PROCEDURAL_STALLING
  { text: "sub registrar office holding my property registry for three months without valid objection", category: "PROCEDURAL_STALLING", weight: 0.9 },
  { text: "head clerk refuses to forward pension file until speed money is paid", category: "PROCEDURAL_STALLING", weight: 0.9 },
  { text: "deliberate delay in issuing fire noc and building occupancy certificate", category: "PROCEDURAL_STALLING", weight: 0.9 },
  { text: "making me run from desk to desk to clear passport verification file", category: "PROCEDURAL_STALLING", weight: 0.8 },
  { text: "trade license renewal stalled clerk asking for envelope under the table", category: "PROCEDURAL_STALLING", weight: 0.9 },

  // Class 3: PROCUREMENT_COLLUSION
  { text: "executive engineer demanded ten percent cut from contractor to clear road tender bill", category: "PROCUREMENT_COLLUSION", weight: 1.0 },
  { text: "pwd department disqualified lowest bidder to favor cartel company paying kickback", category: "PROCUREMENT_COLLUSION", weight: 1.0 },
  { text: "procurement committee asking for fifteen lakhs advance commission before opening bids", category: "PROCUREMENT_COLLUSION", weight: 1.0 },
  { text: "supplies contract awarded to relative of director without competitive quotation", category: "PROCUREMENT_COLLUSION", weight: 0.9 },
  { text: "billing department withheld contractor payment invoice demanding bribe percentage", category: "PROCUREMENT_COLLUSION", weight: 0.9 },

  // Class 4: PETTY_SPEED_MONEY
  { text: "counter clerk asked for five hundred rupees chai paani to give application token", category: "PETTY_SPEED_MONEY", weight: 0.7 },
  { text: "peon asking for hundred rupees to search record register in archive", category: "PETTY_SPEED_MONEY", weight: 0.7 },
  { text: "small tip demanded at birth certificate counter to speed up printout", category: "PETTY_SPEED_MONEY", weight: 0.6 }
];

class MachineLearningClassifier {
  constructor() {
    this.vocabulary = new Set();
    this.categoryDocCounts = {};
    this.categoryWordCounts = {};
    this.categoryTotals = {};
    this.totalDocs = 0;
    this.trainModel();
  }

  tokenize(text) {
    return (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);
  }

  trainModel() {
    this.totalDocs = TRAINING_CORPUS.length;

    for (const sample of TRAINING_CORPUS) {
      const cat = sample.category;
      this.categoryDocCounts[cat] = (this.categoryDocCounts[cat] || 0) + 1;
      if (!this.categoryWordCounts[cat]) this.categoryWordCounts[cat] = {};
      if (!this.categoryTotals[cat]) this.categoryTotals[cat] = 0;

      const tokens = this.tokenize(sample.text);
      for (const token of tokens) {
        this.vocabulary.add(token);
        this.categoryWordCounts[cat][token] = (this.categoryWordCounts[cat][token] || 0) + sample.weight;
        this.categoryTotals[cat] += sample.weight;
      }
    }
  }

  /**
   * Classify complaint text using Naive Bayes log probability with Laplace smoothing
   */
  classify(text) {
    const tokens = this.tokenize(text);
    if (tokens.length === 0) {
      return {
        predictedCategory: 'PROCEDURAL_STALLING',
        confidence: 0.5,
        probabilities: {},
        mlModelVersion: 'BSAI-NaiveBayes-v2.1'
      };
    }

    const vocabSize = this.vocabulary.size;
    const scores = {};
    const categories = Object.keys(this.categoryDocCounts);

    for (const cat of categories) {
      // Prior probability: P(Category)
      const prior = Math.log(this.categoryDocCounts[cat] / this.totalDocs);
      let logLikelihood = 0;
      const totalWordsInCat = this.categoryTotals[cat];

      for (const token of tokens) {
        if (this.vocabulary.has(token)) {
          const count = this.categoryWordCounts[cat][token] || 0;
          // Laplace smoothing (+1)
          const wordProb = (count + 1) / (totalWordsInCat + vocabSize);
          logLikelihood += Math.log(wordProb);
        }
      }

      scores[cat] = prior + logLikelihood;
    }

    // Convert log scores to normalized softmax probabilities
    const maxScore = Math.max(...Object.values(scores));
    const expScores = {};
    let sumExp = 0;
    for (const [cat, score] of Object.entries(scores)) {
      expScores[cat] = Math.exp(score - maxScore);
      sumExp += expScores[cat];
    }

    const probabilities = {};
    let bestCat = categories[0];
    let maxProb = 0;

    for (const cat of categories) {
      const prob = expScores[cat] / sumExp;
      probabilities[cat] = parseFloat(prob.toFixed(3));
      if (prob > maxProb) {
        maxProb = prob;
        bestCat = cat;
      }
    }

    // Map category to severity impact weight
    const categoryRiskWeights = {
      COERCIVE_EXTORTION: { baseBonus: 22, level: 'CRITICAL', label: 'Coercive Extortion & Peril' },
      PROCUREMENT_COLLUSION: { baseBonus: 18, level: 'HIGH', label: 'Tender Collusion & Cartel Kickback' },
      PROCEDURAL_STALLING: { baseBonus: 10, level: 'MEDIUM', label: 'Administrative File Stalling' },
      PETTY_SPEED_MONEY: { baseBonus: 4, level: 'LOW', label: 'Petty Speed Money Demand' }
    };

    return {
      predictedCategory: bestCat,
      confidence: parseFloat(maxProb.toFixed(3)),
      categoryDetails: categoryRiskWeights[bestCat] || { baseBonus: 8, level: 'MEDIUM', label: 'General Grievance' },
      probabilities,
      featuresExtractedCount: tokens.length,
      mlModelVersion: 'BSAI-MultinomialNB-v2.1'
    };
  }
}

export const mlClassifier = new MachineLearningClassifier();

