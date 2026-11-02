import { mlClassifier } from './ml.classifier.js';

// Vocabulary dictionaries with weighted risk coefficients
const CORRUPTION_KEYWORDS = {
  extortion: ['extortion', 'threatened', 'blackmail', 'harass', 'forced', 'coerced', 'intimidated', 'retaliation', 'demanded cash', 'hafta', 'vasooli', 'bribe', 'speed money'],
  delayTactics: ['stalling', 'delaying file', 'refusing to process', 'withholding certificate', 'deliberate delay', 'pending approval', 'held up', 'making me run around'],
  highStakeServices: ['noc', 'registry', 'property deed', 'building permit', 'passport', 'fir', 'chargesheet', 'tender', 'contract award', 'license renewal', 'ration card'],
  authorityRanks: ['commissioner', 'director', 'superintendent', 'dsp', 'sho', 'inspector', 'tehsildar', 'magistrate', 'judge', 'chief engineer', 'head clerk', 'rto officer']
};

class NlpService {
  /**
   * Main entry point: Analyze complaint text with Rule-Based + Machine Learning Hybrid
   */
  analyzeComplaint({ description, statedBribeAmount, department, category, evidenceCount = 0 }) {
    const text = (description || '').toLowerCase();

    // 1. Run Machine Learning Naive Bayes + TF-IDF Classifier
    const mlPrediction = mlClassifier.classify(description);

    // 2. Extract bribe amounts mentioned in text if not explicitly stated
    const detectedAmount = this.extractFinancialDemand(description, statedBribeAmount);

    // 3. Perform sentiment & psychological severity analysis
    const sentiment = this.computeSentimentAndTone(text);

    // 4. Detect corruption pattern categories
    const patterns = this.detectPatterns(text);

    // 5. Detect official rank / seniority cues
    const rankAnalysis = this.analyzeAuthorityRank(text);

    // 6. Evaluate urgency and coercion level
    const urgency = this.evaluateUrgency(text);

    // 7. Calculate transparent multi-factor risk score (0 - 100) combining rule + ML weights
    const { totalScore, riskLevel, riskFactors } = this.calculateRiskScore({
      text,
      amount: detectedAmount.amount,
      department,
      category,
      evidenceCount,
      sentiment,
      patterns,
      rankAnalysis,
      urgency,
      mlPrediction
    });

    return {
      score: totalScore,
      riskLevel,
      factors: riskFactors,
      nlpInsights: {
        financialAnalysis: detectedAmount,
        sentiment,
        detectedPatterns: patterns,
        authorityCues: rankAnalysis,
        urgencyScore: urgency.score,
        urgencyReasons: urgency.reasons,
        mlClassification: {
          predictedPattern: mlPrediction.predictedCategory,
          patternLabel: mlPrediction.categoryDetails.label,
          confidence: `${(mlPrediction.confidence * 100).toFixed(1)}%`,
          distribution: mlPrediction.probabilities,
          modelVersion: mlPrediction.mlModelVersion
        },
        summary: this.generateExecutiveSummary({
          riskLevel,
          totalScore,
          patterns,
          amount: detectedAmount.amount,
          department,
          mlLabel: mlPrediction.categoryDetails.label
        })
      }
    };
  }

  extractFinancialDemand(rawText, explicitAmount) {
    if (explicitAmount && !isNaN(Number(explicitAmount)) && Number(explicitAmount) > 0) {
      return {
        amount: Number(explicitAmount),
        currency: 'INR',
        confidence: 1.0,
        source: 'EXPLICIT_FIELD'
      };
    }

    if (!rawText) return { amount: 0, currency: 'INR', confidence: 0, source: 'NONE' };
    const text = rawText.toLowerCase();

    const patterns = [
      /(?:rs\.?|inr|₹|\$)\s*([\d,]+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lac|l|k|thousand)?/i,
      /([\d,]+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lac|l|k|thousand)\s*(?:rupees|rs|inr)?/i,
      /(?:demanded|asked for|wanted|bribe of)\s*(?:rs\.?|inr|₹|\$)?\s*([\d,]+)/i
    ];

    for (const regex of patterns) {
      const match = text.match(regex);
      if (match) {
        const rawNum = match[1].replace(/,/g, '');
        let value = parseFloat(rawNum);
        const unit = (match[2] || '').toLowerCase();

        if (unit.startsWith('cr') || unit.includes('crore')) {
          value *= 10000000;
        } else if (unit.startsWith('l') || unit.includes('lakh') || unit.includes('lac')) {
          value *= 100000;
        } else if (unit === 'k' || unit.includes('thousand')) {
          value *= 1000;
        }

        if (!isNaN(value) && value > 0) {
          return {
            amount: value,
            currency: 'INR',
            confidence: 0.85,
            source: 'NLP_EXTRACTED',
            matchedSnippet: match[0]
          };
        }
      }
    }

    return { amount: 0, currency: 'INR', confidence: 0, source: 'NOT_FOUND' };
  }

  computeSentimentAndTone(text) {
    let distressScore = 0;
    let assertionScore = 0;

    const distressTokens = ['afraid', 'scared', 'helpless', 'no option', 'ruined', 'traumatized', 'harassed', 'desperate', 'suicide', 'starving'];
    const assertionTokens = ['caught red-handed', 'have recording', 'proof', 'video evidence', 'witness', 'receipt', 'call record', 'cctv'];

    distressTokens.forEach(token => {
      if (text.includes(token)) distressScore += 1;
    });

    assertionTokens.forEach(token => {
      if (text.includes(token)) assertionScore += 1;
    });

    return {
      distressLevel: distressScore >= 2 ? 'HIGH' : distressScore === 1 ? 'MODERATE' : 'LOW',
      assertionConfidence: assertionScore >= 2 ? 'HIGH' : assertionScore === 1 ? 'MODERATE' : 'LOW',
      distressScore,
      assertionScore
    };
  }

  detectPatterns(text) {
    const matched = [];

    if (CORRUPTION_KEYWORDS.extortion.some(kw => text.includes(kw))) {
      matched.push({ type: 'EXTORTION_COERCION', severity: 'HIGH', label: 'Coercive extortion or threat' });
    }
    if (CORRUPTION_KEYWORDS.delayTactics.some(kw => text.includes(kw))) {
      matched.push({ type: 'ADMINISTRATIVE_STALLING', severity: 'MEDIUM', label: 'Deliberate procedural delay' });
    }
    if (CORRUPTION_KEYWORDS.highStakeServices.some(kw => text.includes(kw))) {
      matched.push({ type: 'ESSENTIAL_SERVICE_BLOCK', severity: 'HIGH', label: 'Withholding essential citizen service/NOC' });
    }

    return matched;
  }

  analyzeAuthorityRank(text) {
    const foundRanks = [];
    CORRUPTION_KEYWORDS.authorityRanks.forEach(rank => {
      if (text.includes(rank)) {
        foundRanks.push(rank);
      }
    });

    const isSeniorOfficial = foundRanks.some(r =>
      ['commissioner', 'director', 'superintendent', 'dsp', 'chief engineer', 'magistrate', 'judge'].includes(r)
    );

    return {
      detectedRanks: foundRanks,
      isSeniorOfficial,
      rankWeight: isSeniorOfficial ? 20 : foundRanks.length > 0 ? 12 : 5
    };
  }

  evaluateUrgency(text) {
    let score = 0;
    const reasons = [];

    const urgencyTriggers = [
      { trigger: 'today', points: 15, reason: 'Immediate same-day timeline mentioned' },
      { trigger: 'tomorrow', points: 12, reason: '24-hour deadline stated' },
      { trigger: 'within 24 hours', points: 20, reason: 'Explicit 24h deadline stated' },
      { trigger: 'arrest', points: 25, reason: 'Threat of imminent arrest' },
      { trigger: 'demolition', points: 20, reason: 'Threat of property demolition' },
      { trigger: 'cancel', points: 15, reason: 'Threat of license or registration cancellation' },
      { trigger: 'auction', points: 15, reason: 'Threat of property seizure or auction' }
    ];

    urgencyTriggers.forEach(item => {
      if (text.includes(item.trigger)) {
        score += item.points;
        reasons.push(item.reason);
      }
    });

    return {
      score: Math.min(score, 30),
      reasons: reasons.slice(0, 3)
    };
  }

  calculateRiskScore({ text, amount, department, category, evidenceCount, sentiment, patterns, rankAnalysis, urgency, mlPrediction }) {
    const factors = [];
    let score = 10;

    // ML Model Classification Weight
    if (mlPrediction && mlPrediction.categoryDetails) {
      const mlBonus = mlPrediction.categoryDetails.baseBonus || 10;
      score += mlBonus;
      factors.push({
        name: 'ML Pattern Probability',
        score: mlBonus,
        reason: `ML Classifier predicted: ${mlPrediction.categoryDetails.label} (${(mlPrediction.confidence * 100).toFixed(0)}% confidence).`
      });
    }

    // Factor 1: Department Severity
    let deptScore = 8;
    const highRiskDepts = ['police', 'revenue', 'judiciary', 'land records', 'excise', 'public works department', 'pwd'];
    const deptLower = (department || '').toLowerCase();
    if (highRiskDepts.some(d => deptLower.includes(d))) {
      deptScore = 18;
      factors.push({ name: 'Sensitive Authority Domain', score: deptScore, reason: `Department (${department}) has elevated coercive power.` });
    } else {
      factors.push({ name: 'Civic Administration Context', score: deptScore, reason: 'Standard civic governance department.' });
    }
    score += deptScore;

    // Factor 2: Financial Magnitude
    let financialScore = 0;
    if (amount >= 1000000) {
      financialScore = 25;
      factors.push({ name: 'Severe Financial Quantum', score: 25, reason: `Demanded amount of ₹${amount.toLocaleString()} indicates high-level syndicate graft.` });
    } else if (amount >= 100000) {
      financialScore = 18;
      factors.push({ name: 'Substantial Financial Demand', score: 18, reason: `Demanded amount of ₹${amount.toLocaleString()} exceeds statutory threshold.` });
    } else if (amount >= 10000) {
      financialScore = 12;
      factors.push({ name: 'Documented Graft Demand', score: 12, reason: `Demanded amount of ₹${amount.toLocaleString()} recorded.` });
    } else if (amount > 0) {
      financialScore = 6;
      factors.push({ name: 'Petty Speed Money Demand', score: 6, reason: `Speed money demand of ₹${amount.toLocaleString()}.` });
    }
    score += financialScore;

    // Factor 3: Threat & Urgency
    if (urgency.score > 0) {
      const uScore = Math.min(urgency.score, 20);
      score += uScore;
      factors.push({ name: 'Imminent Coercion / Peril', score: uScore, reason: urgency.reasons.join('; ') });
    }

    // Factor 4: Official Hierarchy Rank
    if (rankAnalysis.detectedRanks.length > 0) {
      const rScore = Math.min(rankAnalysis.rankWeight, 15);
      score += rScore;
      factors.push({
        name: 'Seniority Designation of Accused',
        score: rScore,
        reason: `Identified official rank: ${rankAnalysis.detectedRanks.join(', ')}`
      });
    }

    // Factor 5: Corroborating Evidence Strength
    if (evidenceCount > 0) {
      const evScore = Math.min(evidenceCount * 5, 15);
      score += evScore;
      factors.push({ name: 'Corroborating Evidence Files', score: evScore, reason: `${evidenceCount} digital evidence file(s) attached.` });
    }

    // Clamp score 0 - 100
    const totalScore = Math.max(5, Math.min(Math.round(score), 100));

    let riskLevel = 'LOW';
    if (totalScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (totalScore >= 60) {
      riskLevel = 'HIGH';
    } else if (totalScore >= 35) {
      riskLevel = 'MEDIUM';
    }

    return {
      totalScore,
      riskLevel,
      riskFactors: factors
    };
  }

  generateExecutiveSummary({ riskLevel, totalScore, patterns, amount, department, mlLabel }) {
    const patternSummary = patterns.map(p => p.label).join(', ') || mlLabel || 'Procedural irregularity';
    const amountStr = amount > 0 ? ` (demanded ₹${amount.toLocaleString()})` : '';
    return `Priority ${riskLevel} (Risk Index: ${totalScore}/100) complaint in ${department || 'Public Sector'}${amountStr}. ML Pattern: ${mlLabel}. Identified signals: ${patternSummary}. Recommended for expedited verification.`;
  }
}

export const nlpService = new NlpService();
