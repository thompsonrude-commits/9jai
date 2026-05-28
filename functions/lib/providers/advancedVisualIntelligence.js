"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GENERATION_STAGES = void 0;
exports.expandPrompt = expandPrompt;
exports.generateNegativePrompt = generateNegativePrompt;
exports.scoreVisionAccuracy = scoreVisionAccuracy;
exports.generateDynamicSeeds = generateDynamicSeeds;
exports.selectOptimalDimensions = selectOptimalDimensions;
exports.shouldUpscale = shouldUpscale;
exports.estimateQualityScore = estimateQualityScore;
exports.planRenderingStrategy = planRenderingStrategy;
exports.getRefinementStages = getRefinementStages;
exports.buildEnhancedVisualRequest = buildEnhancedVisualRequest;
/**
 * Advanced Visual Intelligence Engine v2
 * TRUE Generative Pipeline — ChatGPT-Class Cinematic Engine
 * OVERHAULED: Strict scene physics, action detection, and object count enforcement.
 */
const visualIntelligence_1 = require("./visualIntelligence");
/**
 * TRUE Generative Pipeline Step 1: Prompt Parsing & Scene Understanding
 */
function parseScene(prompt) {
    const lower = prompt.toLowerCase();
    const styles = ['photorealistic', 'cinematic', 'artistic', 'logo', 'conceptual', 'animated'];
    // Helper to convert word numbers to digits
    const wordToNumber = (word) => {
        switch (word.toLowerCase()) {
            case 'one': return 1;
            case 'two': return 2;
            case 'three': return 3;
            case 'four': return 4;
            case 'five': return 5;
            case 'six': return 6;
            case 'seven': return 7;
            case 'eight': return 8;
            case 'nine': return 9;
            case 'ten': return 10;
            default: return parseInt(word);
        }
    };
    let inferredCount = 1;
    const explicitCountMatch = lower.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
    if (explicitCountMatch) {
        const num = wordToNumber(explicitCountMatch[1]);
        if (num !== null)
            inferredCount = num;
    }
    else {
        const parts = lower.split(/ and |,/);
        let totalInferredSubjects = 0;
        for (const part of parts) {
            const trimmedPart = part.trim();
            if (trimmedPart.length > 0 && !['a', 'an', 'the'].includes(trimmedPart.toLowerCase())) {
                totalInferredSubjects += 1;
            }
        }
        if (totalInferredSubjects > 1)
            inferredCount = totalInferredSubjects;
    }
    const sceneCount = inferredCount.toString();
    // Action Detection (Verbs and Motion)
    const actions = ['flying', 'jumping', 'dancing', 'swimming', 'running', 'fighting', 'sitting', 'standing', 'perched', 'walking', 'roaring', 'sleeping', 'eating'];
    const action = actions.find(a => lower.includes(a)) || "";
    // Environment Detection (Context interpretation)
    const environments = ['sky', 'forest', 'mountain', 'ocean', 'city', 'desert', 'studio', 'savannah', 'space', 'underwater', 'indoor', 'outdoor', 'jungle', 'village', 'palace'];
    const environment = environments.find(e => lower.includes(e)) || "";
    // Lighting Detection (Physics interpretation)
    const lightingStyles = ['golden hour', 'sunset', 'sunrise', 'neon', 'dramatic', 'volumetric', 'natural', 'studio', 'low-light', 'bright', 'moonlight', 'candlelight'];
    const lighting = lightingStyles.find(l => lower.includes(l)) || "";
    // Framing/Shot Type Detection (Composition interpretation)
    const framingStyles = ['close-up', 'wide shot', 'portrait', 'landscape', 'macro', 'aerial', 'eye-level', 'low-angle', 'three-quarter', 'panoramic'];
    const framing = framingStyles.find(f => lower.includes(f)) || "";
    // Emotional Mood Detection (Atmosphere interpretation)
    const emotionalTones = ['majestic', 'joyful', 'eerie', 'serene', 'aggressive', 'peaceful', 'mysterious', 'epic', 'melancholic', 'ethereal', 'noir'];
    const mood = emotionalTones.find(m => lower.includes(m)) || "";
    // Realism & Style detection
    const detectedStyle = styles.find(s => lower.includes(s)) || 'photorealistic';
    return { count: sceneCount, action, environment, lighting, framing, mood, style: detectedStyle, raw: prompt };
}
/**
 * TRUE Generative Pipeline Step 2: AI Prompt Expansion
 */
function expandPrompt(prompt, style) {
    const scene = parseScene(prompt);
    // STRICT OBJECT COUNTING
    const countDirective = `EXACTLY ${scene.count.toUpperCase()} INDIVIDUAL SUBJECTS`;
    // STRICT ACTION PHYSICS
    let actionInstruction = "";
    if (scene.action === 'flying') {
        actionInstruction = "STRICTLY AIRBORNE, wings spread wide, dynamic aerial flight formation, realistic sky interaction, airborne posture, NO LANDING, NO PERCHING";
    }
    else if (scene.action === 'running') {
        actionInstruction = "sprinting at full speed, powerful athletic strides, kick of dust, dynamic high-speed motion blur, motion realism, active movement";
    }
    else if (scene.action === 'sitting' || scene.action === 'perched') {
        actionInstruction = "perched with a perfectly dignified and majestic posture, completely stationary and poised, sharp focus";
    }
    else if (scene.action) {
        actionInstruction = `engaged in ${scene.action} action, realistic movement physics, high-fidelity motion detail`;
    }
    // SCENE CONTEXTUALIZATION
    const envInstruction = scene.environment ? `set within a detailed ${scene.environment} environment` : "cinematic depth of field background";
    const moodInstruction = scene.mood ? `conveying a ${scene.mood} atmosphere` : "";
    const lightingInstruction = scene.lighting ? `dramatically lit with ${scene.lighting} lighting` : "professional cinematic lighting";
    const framingInstruction = scene.framing ? `composed as a ${scene.framing}` : "expertly composed frame";
    const africanCue = /\b(africa|african|nigeria|nigerian|ghana|yoruba|igbo|hausa|lagos|abuja|accra|kigali|afrofuturism)\b/i.test(prompt);
    const afroInstruction = africanCue ? 'authentic African skin tones, realistic Nigerian fashion, natural African hairstyles, warm melanin lighting, culturally accurate details, expressive African eyes' : '';
    // TECHNICAL CINEMATIC PARAMS
    const technical = "shot on Sony A7R IV, 85mm f/1.4 GM lens, unedited RAW photography, national geographic quality, 8k resolution, ray-traced global illumination, intricate textural realism, professional color grading";
    const artistic = getArtisticStyle(style);
    return [
        `Masterpiece visual of ${prompt}`,
        countDirective,
        actionInstruction,
        envInstruction,
        moodInstruction,
        lightingInstruction,
        framingInstruction,
        afroInstruction,
        artistic,
        technical,
        "highest visual fidelity, award winning, hyper-detailed textures, realistic anatomy, sharp focus, no blur, no artifacts"
    ].filter(Boolean).join(', ');
}
/**
 * TRUE Generative Pipeline Step 3: Negative Prompt Construction (Strict Veto)
 */
function generateNegativePrompt(style, prompt) {
    const scene = parseScene(prompt);
    const negMap = visualIntelligence_1.NEGATIVE_PROMPTS;
    const common = negMap[style] || "blurry, low quality, distorted, ugly, deformed, amateur, watermark, signature, text, pixelated, artifacts, noise, svg, placeholder, symbolic graphics";
    // Action-specific negation (Force correct visual states)
    const actionNegatives = {
        'flying': ['standing', 'perched', 'grounded', 'sitting', 'folded wings', 'walking', 'stationary'],
        'running': ['standing', 'static', 'stationary', 'sleeping', 'walking'],
        'swimming': ['dry', 'on land', 'standing', 'walking'],
        'jumping': ['standing', 'sitting', 'static']
    };
    const specificNegatives = actionNegatives[scene.action] || [];
    // Combine common negatives with action-specific negatives
    const uniqueNegatives = Array.from(new Set([...common.split(', ').map(s => s.trim()).filter(Boolean), ...specificNegatives]));
    return uniqueNegatives.join(', ');
}
/**
 * Post-Generation Scoring: Simulated Vision Validation
 * This function simulates AI image analysis for object count, action, and anatomy.
 * In a real system, this would involve a separate vision model.
 */
function scoreVisionAccuracy(candidate, req) {
    const scene = parseScene(req.prompt);
    let score = candidate.qualityScore || 50;
    // Simulate object count enforcement
    const requestedCount = parseInt(scene.count);
    if (requestedCount > 1) {
        if (candidate.bytesLength && candidate.bytesLength > 85000)
            score += 15;
        else
            score -= 10;
    }
    if (scene.action) {
        if (candidate.model.includes('flux') || candidate.model.includes('turbo'))
            score += 5;
        else
            score -= 5;
    }
    if (req.prompt.length > 50 && candidate.bytesLength && candidate.bytesLength < 50000)
        score -= 15;
    return Math.min(score, 98);
}
/**
 * Dynamic Camera Composition Selection
 */
function getCameraAngle(composition) {
    const angles = {
        centered: 'eye-level straight-on shot, symmetrical framing, IMAX depth',
        'golden-ratio': 'cinematic offset composition, golden ratio alignment, professional framing',
        'rule-of-thirds': 'professional rule-of-thirds framing, dynamic visual balance',
        dynamic: 'low-angle heroic perspective, wide-angle lens distortion, epic cinematic movement',
        symmetrical: 'perfectly mirrored symmetrical composition, centered focal point, Wes Anderson aesthetic'
    };
    return angles[composition] || 'cinematic eye-level shot';
}
/**
 * Lighting Physics Simulation
 */
function getLightingSimulation(lighting) {
    const simulation = {
        natural: 'soft natural morning light, golden hour glow, realistic ray-tracing, soft shadows, 8k RAW',
        dramatic: 'high-contrast dramatic chiaroscuro lighting, deep cinematic shadows, volumetric rim light',
        studio: 'professional three-point studio lighting, softbox diffusion, wrap-around wrap-light',
        volumetric: 'volumetric god rays, atmospheric haze interaction, light shafts through dust, cinematic depth',
        neon: 'vibrant neon global illumination, cyan and magenta color bleed, rainy street reflections, cyberpunk aesthetic'
    };
    return simulation[lighting] || 'cinematic lighting';
}
/**
 * Artistic Style Refinement
 */
function getArtisticStyle(style) {
    const styles = {
        photorealistic: 'raw photography, shot on Sony A7R IV, 85mm f/1.4 lens, unedited realism, National Geographic quality, hyper-realistic',
        cinematic: 'anamorphic lens flare, 35mm film stock, Panavision aesthetics, cinematic color grade, IMAX visual fidelity',
        artistic: 'masterpiece digital art, trending on ArtStation, complex brushwork, vivid color theory, ethereal atmosphere',
        logo: 'flat vector graphic, Apple-style minimalism, perfect geometry, Adobe Illustrator precision, scalable branding',
        conceptual: 'surreal conceptual masterpiece, imaginative lighting, intricate symbolic details, award-winning art',
        animated: 'Pixar-style 3D rendering, Octane Render, subsurface scattering, vibrant stylized textures, 8k fidelity',
        'brand-identity': 'professional corporate branding kit, clean minimalist aesthetic, high-end typography, brand guidelines style, professional layout, architectural precision'
    };
    return styles[style] || 'premium high-fidelity rendering';
}
/**
 * Generation Stages for UI Visualization (Cinematic Animation Triggers)
 */
exports.GENERATION_STAGES = [
    "Analyzing Scene Structure...",
    "Building Cinematic Composition...",
    "Simulating Lighting Physics...",
    "Refining Anatomy...",
    "Enhancing Textural Realism...",
    "Optimizing Visual Fidelity...",
    "Finalizing Visual Fidelity..."
];
function generateDynamicSeeds(count = 4) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 9999999));
}
/**
 * Select optimal Pollinations model based on style and quality
 */
function selectOptimalModel(style, quality) {
    if (style === 'anime')
        return 'flux-anime';
    if (style === 'logo' || style === 'brand-identity' || style === 'icon')
        return 'turbo';
    if (style === 'african_art' && quality !== 'standard')
        return 'stable-diffusion-xl';
    if (quality === 'ultra')
        return 'stable-diffusion-xl';
    if (quality === 'premium')
        return 'flux';
    return 'stable-diffusion-3.5-large';
}
function selectOptimalDimensions(style) {
    if (style === 'cinematic')
        return { width: 1536, height: 864 };
    if (style === 'portrait')
        return { width: 1024, height: 1280 };
    if (style === 'african_art')
        return { width: 1280, height: 1280 };
    if (style === 'photorealistic')
        return { width: 1280, height: 1280 };
    if (style === 'logo')
        return { width: 768, height: 768 };
    return { width: 1024, height: 1024 };
}
/**
 * Stage 6: Upscaling Configuration
 * When to apply upscaling for final polish
 */
function shouldUpscale(quality) {
    return quality === 'premium' || quality === 'ultra';
}
/**
 * Stage 7: Quality Scoring Heuristics
 * Predict image quality before rendering
 */
function estimateQualityScore(req) {
    let score = 50; // Base score
    // Style bonus
    if (req.style === 'photorealistic' || req.style === 'cinematic')
        score += 15;
    else
        score += 10;
    // Quality bonus
    score += req.quality === 'ultra' ? 20 : req.quality === 'premium' ? 15 : 5;
    // Lighting bonus
    if (req.lighting === 'dramatic' || req.lighting === 'volumetric')
        score += 10;
    // Detail bonus
    score += req.detail === 'extreme' ? 15 : req.detail === 'high' ? 10 : 5;
    // Cap at 100
    return Math.min(score, 95);
}
/**
 * Stage 8: Multi-Stage Rendering Strategy
 * Plan the rendering approach
 */
function planRenderingStrategy(req) {
    const quality = req.quality || 'standard';
    const style = req.style || 'photorealistic';
    let stages = 1;
    let timeouts = [50000];
    let models = [selectOptimalModel(style, quality)];
    if (quality === 'premium') {
        stages = 2;
        timeouts = [40000, 35000];
        models = [
            selectOptimalModel(style, 'premium'),
            selectOptimalModel(style, 'standard')
        ];
    }
    else if (quality === 'ultra') {
        stages = 3;
        timeouts = [40000, 35000, 30000];
        models = [
            selectOptimalModel(style, 'ultra'),
            selectOptimalModel(style, 'premium'),
            selectOptimalModel(style, 'standard')
        ];
    }
    return {
        stages,
        models,
        seeds: generateDynamicSeeds(stages),
        timeouts
    };
}
/**
 * Stage 9: Refinement Stages
 * Apply progressive refinement for premium outputs
 */
function getRefinementStages(quality) {
    switch (quality) {
        case 'ultra':
            return 3; // 3 refinement stages
        case 'premium':
            return 2; // 2 refinement stages
        default:
            return 1; // 1 stage
    }
}
/**
 * Main: Build Complete Enhanced Request
 */
function buildEnhancedVisualRequest(req) {
    const mode = (0, visualIntelligence_1.detectVisualMode)(req.prompt); // Use detectVisualMode from visualIntelligence
    const style = req.style || mode; // Use detected mode as default style
    const quality = req.quality || 'premium';
    const brandName = (style === 'logo' || style === 'brand-identity') ? (0, visualIntelligence_1.extractBrandName)(req.prompt) : undefined;
    const enhancedPrompt = expandPrompt(req.prompt, style);
    const negativePrompt = generateNegativePrompt(style, req.prompt);
    const dimensions = selectOptimalDimensions(style);
    const strategy = planRenderingStrategy(req);
    // Multi-candidate ranking logic (Step 10: Generate 3-8 hidden candidates)
    const candidates = strategy.seeds.map(seed => ({
        seed,
        qualityScore: estimateQualityScore(req) + (Math.random() * 10 - 5), // Score variance simulation
        model: strategy.models[0],
    }))
        .map(c => ({ ...c, qualityScore: scoreVisionAccuracy(c, req) })) // Step 10: Analyze prompt accuracy
        .sort((a, b) => b.qualityScore - a.qualityScore);
    // Step 10: ONLY display the BEST image
    const topCandidate = candidates[0];
    return {
        originalPrompt: req.prompt,
        enhancedPrompt,
        negativePrompt,
        seeds: candidates.map(c => c.seed),
        width: dimensions.width,
        height: dimensions.height,
        style,
        quality: quality === 'ultra' ? 95 : quality === 'premium' ? 85 : 70,
        lighting: req.lighting || 'natural',
        composition: req.composition || 'centered',
        detail: req.detail || 'high',
        upscale: shouldUpscale(quality),
        refinementStages: getRefinementStages(quality),
        estimatedQualityScore: topCandidate.qualityScore,
        renderingStages: exports.GENERATION_STAGES,
        candidates
    };
}
//# sourceMappingURL=advancedVisualIntelligence.js.map