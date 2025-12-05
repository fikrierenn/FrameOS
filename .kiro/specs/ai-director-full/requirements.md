# Requirements Document - AI Director Full System

## Introduction

**PIVOTERA DIRECTOR MODE** - Dünyanın ilk tam kapsamlı AI Video Yönetmeni. Video yüklendiğinde AI izler, dinler, analiz eder ve profesyonel bir yönetmen gibi öneriler sunar. Ses tonu, mimik, el hareketi, beden dili, kamera açısı, ışık - her şeyi analiz edip yönetmenlik yapar.

## Glossary

- **System**: PIVOTERA AI Director Mode
- **User**: Video yükleyen kullanıcı (influencer, emlakçı, içerik üreticisi)
- **Video**: Analiz edilecek video dosyası
- **Director AI**: Video analiz eden ve öneriler sunan AI sistemi
- **Voice Director**: Ses tonu analizi yapan modül
- **Face Director**: Mimik analizi yapan modül
- **Gesture Director**: El hareketi ve beden dili analizi yapan modül
- **Cinematic Director**: Kamera, ışık, kadraj analizi yapan modül
- **Director Note**: AI'nin verdiği yönetmenlik önerisi
- **Confidence Score**: AI'nin analiz güven skoru (0-100)
- **Segment**: Video'nun zaman damgalı bölümü

---

## Requirements

### Requirement 1: Voice Director (Ses Tonu Analizi)

**User Story:** As a content creator, I want AI to analyze my voice tone, pitch, tempo, and emphasis, so that I can improve my vocal delivery and engagement.

#### Acceptance Criteria

1. WHEN a video is uploaded THEN the System SHALL extract audio and analyze voice characteristics including tone, pitch, tempo, and breath points
2. WHEN voice analysis is complete THEN the System SHALL generate a confidence score for vocal delivery quality
3. WHEN monotone speech is detected THEN the System SHALL provide specific timestamps and suggestions for pitch variation
4. WHEN emphasis is missing on key words THEN the System SHALL identify those words and suggest vocal emphasis
5. WHEN speaking tempo is too fast or too slow THEN the System SHALL provide tempo adjustment recommendations with specific segments
6. WHEN breath points are incorrectly placed THEN the System SHALL suggest optimal pause locations
7. WHEN CTA (Call-to-Action) delivery is weak THEN the System SHALL recommend tone sharpening and emphasis techniques

---

### Requirement 2: Face Director (Mimik Analizi)

**User Story:** As a video presenter, I want AI to analyze my facial expressions, eye contact, and confidence, so that I can appear more engaging and trustworthy.

#### Acceptance Criteria

1. WHEN a video is uploaded THEN the System SHALL detect faces and analyze facial expressions frame-by-frame
2. WHEN facial analysis is complete THEN the System SHALL generate confidence scores for eye contact, smile frequency, and natural expression
3. WHEN eye contact is insufficient THEN the System SHALL identify timestamps where gaze deviates from camera
4. WHEN facial expressions are frozen or unnatural THEN the System SHALL flag those segments with improvement suggestions
5. WHEN smile frequency is low during positive content THEN the System SHALL recommend specific moments to smile
6. WHEN tension or stress is visible in facial muscles THEN the System SHALL suggest relaxation techniques for those segments
7. WHEN facial expressions contradict spoken content THEN the System SHALL flag the mismatch and suggest alignment

---

### Requirement 3: Gesture Director (El Hareketi ve Beden Dili)

**User Story:** As a presenter, I want AI to analyze my hand gestures and body language, so that I can communicate more effectively and appear more professional.

#### Acceptance Criteria

1. WHEN a video is uploaded THEN the System SHALL detect and track hand movements and body posture throughout the video
2. WHEN gesture analysis is complete THEN the System SHALL generate scores for gesture frequency, appropriateness, and synchronization
3. WHEN hand gestures are absent during key points THEN the System SHALL suggest where to add gestures for emphasis
4. WHEN hand gestures are excessive or distracting THEN the System SHALL recommend reduction and control
5. WHEN hand movements are out of frame THEN the System SHALL flag those moments as unprofessional
6. WHEN gestures contradict spoken message THEN the System SHALL identify the mismatch and suggest corrections
7. WHEN body posture is poor THEN the System SHALL provide posture correction suggestions with timestamps

---

### Requirement 4: Cinematic Director (Kamera, Işık, Kadraj)

**User Story:** As a video creator, I want AI to analyze camera angle, lighting, framing, and composition, so that I can improve the visual quality of my videos.

#### Acceptance Criteria

1. WHEN a video is uploaded THEN the System SHALL analyze camera angle, framing, lighting, background, and color balance
2. WHEN cinematic analysis is complete THEN the System SHALL generate quality scores for each visual element
3. WHEN lighting is poor THEN the System SHALL identify problematic segments and suggest lighting improvements
4. WHEN framing is incorrect THEN the System SHALL recommend camera position adjustments
5. WHEN background is cluttered or distracting THEN the System SHALL suggest background improvements
6. WHEN camera angle is unflattering THEN the System SHALL provide specific angle adjustment recommendations
7. WHEN color balance is off THEN the System SHALL suggest color correction parameters

---

### Requirement 4B: Cinematic Director - Error Handling & Reliability (NEW)

**User Story:** As a developer, I want the cinematic analysis to handle errors gracefully and provide detailed debugging information, so that I can quickly identify and fix issues when they occur.

#### Acceptance Criteria

1. WHEN the GPT-4o API call fails THEN the System SHALL log the complete error details including error type, message, HTTP status, and error code
2. WHEN an API error occurs THEN the System SHALL throw a descriptive error message that includes the root cause
3. WHEN JSON parsing fails THEN the System SHALL log the raw response content before throwing an error
4. WHEN frame processing fails THEN the System SHALL log which frame caused the error and continue with remaining frames
5. WHEN the analysis starts THEN the System SHALL log step-by-step progress (1/6, 2/6, etc.) for debugging
6. WHEN frames are provided THEN the System SHALL validate that all files exist before making expensive API calls
7. WHEN GPT-4o is unavailable THEN the System SHALL attempt to use an alternative model (gpt-4-turbo) as fallback
8. WHEN all vision models fail THEN the System SHALL return a mock analysis with a warning flag
9. WHEN rate limits are exceeded THEN the System SHALL implement exponential backoff retry logic
10. WHEN errors occur THEN the System SHALL provide user-friendly error messages that explain the problem and suggest solutions

---

### Requirement 5: Synchronization Analysis (Senkronizasyon)

**User Story:** As a presenter, I want AI to analyze synchronization between my voice, facial expressions, and gestures, so that my delivery appears natural and coherent.

#### Acceptance Criteria

1. WHEN all individual analyses are complete THEN the System SHALL perform cross-modal synchronization analysis
2. WHEN voice tone and facial expression mismatch THEN the System SHALL flag the inconsistency with timestamps
3. WHEN hand gestures and spoken emphasis are out of sync THEN the System SHALL identify the timing mismatch
4. WHEN energy level drops across multiple modalities THEN the System SHALL detect the engagement dip and suggest recovery
5. WHEN CTA delivery lacks multi-modal emphasis THEN the System SHALL recommend synchronized improvements across voice, face, and gesture
6. WHEN emotional tone conflicts across modalities THEN the System SHALL provide alignment suggestions
7. WHEN overall coherence score is low THEN the System SHALL generate a prioritized list of improvements

---

### Requirement 6: Director Notes Generation

**User Story:** As a user, I want to receive clear, actionable director notes with timestamps, so that I know exactly what to improve and when.

#### Acceptance Criteria

1. WHEN all analyses are complete THEN the System SHALL generate timestamped director notes for each issue
2. WHEN generating director notes THEN the System SHALL include visual, audio, speech, and reasoning for each note
3. WHEN multiple issues occur in the same segment THEN the System SHALL prioritize and combine notes intelligently
4. WHEN director notes are displayed THEN the System SHALL organize them by timestamp in chronological order
5. WHEN a user clicks on a director note THEN the System SHALL jump the video player to that timestamp
6. WHEN director notes are generated THEN the System SHALL include severity levels (critical, important, minor)
7. WHEN exporting director notes THEN the System SHALL provide PDF, JSON, and text format options

---

### Requirement 7: Full Script Rewrite with Multi-Modal Context

**User Story:** As a content creator, I want AI to rewrite my entire script considering all visual and vocal elements, so that I get a professionally optimized version.

#### Acceptance Criteria

1. WHEN full rewrite mode is selected THEN the System SHALL analyze transcription, voice, face, gesture, and cinematic elements together
2. WHEN generating rewritten script THEN the System SHALL optimize for engagement, clarity, and conversion
3. WHEN rewriting segments THEN the System SHALL consider detected visual and vocal strengths and weaknesses
4. WHEN suggesting new lines THEN the System SHALL include delivery instructions (tone, gesture, expression)
5. WHEN rewritten script is complete THEN the System SHALL provide side-by-side comparison with original
6. WHEN displaying rewritten script THEN the System SHALL highlight improvements and reasoning for each change
7. WHEN exporting rewritten script THEN the System SHALL include teleprompter-ready format with timing marks

---

### Requirement 8: Real-Time Preview and Comparison

**User Story:** As a user, I want to see visual overlays and comparisons while watching my video, so that I can understand the analysis in context.

#### Acceptance Criteria

1. WHEN viewing analyzed video THEN the System SHALL display confidence scores as overlay graphs
2. WHEN hovering over timeline THEN the System SHALL show analysis summary for that segment
3. WHEN director notes exist for a segment THEN the System SHALL display visual indicators on the timeline
4. WHEN playing video THEN the System SHALL highlight current director note in the sidebar
5. WHEN comparison mode is enabled THEN the System SHALL display before/after suggestions side-by-side
6. WHEN viewing gesture analysis THEN the System SHALL overlay skeleton tracking visualization
7. WHEN viewing face analysis THEN the System SHALL overlay emotion and confidence indicators

---

### Requirement 9: Export and Integration

**User Story:** As a professional creator, I want to export analysis results and integrate with editing tools, so that I can apply improvements efficiently.

#### Acceptance Criteria

1. WHEN export is requested THEN the System SHALL provide multiple format options (PDF, JSON, CSV, SRT)
2. WHEN exporting to PDF THEN the System SHALL include visual charts, graphs, and timestamped notes
3. WHEN exporting to JSON THEN the System SHALL include all raw analysis data with confidence scores
4. WHEN exporting to SRT THEN the System SHALL generate subtitle file with improved script
5. WHEN integration with editing tools is requested THEN the System SHALL provide API endpoints for third-party access
6. WHEN sharing analysis THEN the System SHALL generate shareable link with privacy controls
7. WHEN downloading video with overlays THEN the System SHALL render analysis visualizations into video file

---

### Requirement 9B: PDF Export (IMPLEMENTED)

**User Story:** As a user, I want to export director notes as PDF, so that I can share or print them for offline review.

#### Acceptance Criteria

1. WHEN director analysis is complete THEN the System SHALL display a "📄 PDF İndir" button
2. WHEN PDF export button is clicked THEN the System SHALL open browser print dialog with formatted content
3. WHEN printing THEN the System SHALL include video name, date, and all director notes
4. WHEN printing THEN the System SHALL use print-friendly formatting (no dark backgrounds, readable fonts)
5. WHEN PDF is generated THEN the System SHALL preserve all timestamps, visual notes, audio notes, and reasoning

**Implementation Status**: ✅ COMPLETED (src/app/videos/[id]/page.tsx, line 177-195)

---

### Requirement 11: Video Blob Management (IMPLEMENTED)

**User Story:** As a user, I want to preview my uploaded video immediately after upload, so that I can verify the upload was successful and see analysis results in context.

#### Acceptance Criteria

1. WHEN video is uploaded THEN the System SHALL create a blob URL for immediate playback
2. WHEN navigating to video detail page THEN the System SHALL load video from blob URL stored in sessionStorage
3. WHEN video player is displayed THEN the System SHALL show the uploaded video with full controls
4. WHEN session ends THEN the System SHALL clean up blob URLs to prevent memory leaks
5. WHEN blob URL is not available THEN the System SHALL display a fallback message

**Implementation Status**: ✅ COMPLETED (src/app/upload/page.tsx, line 82-88; src/app/videos/[id]/page.tsx, line 85-90)

---

### Requirement 12: Cinematic Data Integration with Director AI (IMPLEMENTED)

**User Story:** As a user, I want the Director AI to use visual analysis data when generating recommendations, so that suggestions are based on actual video content rather than just transcription.

#### Acceptance Criteria

1. WHEN cinematic analysis is complete THEN the System SHALL pass cinematic data to Director AI
2. WHEN Director AI generates scene notes THEN the System SHALL include visual analysis (camera, lighting, drone detection) in the prompt
3. WHEN drone is detected THEN the Director AI SHALL provide drone-specific recommendations
4. WHEN lighting issues are detected THEN the Director AI SHALL suggest specific lighting improvements
5. WHEN camera movement is analyzed THEN the Director AI SHALL provide stabilization and angle recommendations
6. WHEN Director AI logs are generated THEN the System SHALL log cinematic data availability and drone detection status

**Implementation Status**: ✅ COMPLETED (src/lib/directorAI.ts, line 52-75; src/app/api/director/route.ts, line 21-23)

---

### Requirement 10: Performance and Scalability

**User Story:** As a system administrator, I want the analysis to be fast and scalable, so that users get results quickly even with high traffic.

#### Acceptance Criteria

1. WHEN a video is uploaded THEN the System SHALL process videos up to 10 minutes in length
2. WHEN analysis is running THEN the System SHALL provide real-time progress updates with estimated completion time
3. WHEN multiple analyses are requested THEN the System SHALL queue and process them efficiently
4. WHEN analysis is complete THEN the System SHALL cache results for instant retrieval
5. WHEN system load is high THEN the System SHALL maintain response times under 2 minutes for 5-minute videos
6. WHEN errors occur THEN the System SHALL provide clear error messages and retry options
7. WHEN video quality is poor THEN the System SHALL still attempt analysis and flag quality issues

---

## Success Metrics

1. **Analysis Accuracy**: 90%+ confidence scores on test videos
2. **Processing Speed**: < 2 minutes for 5-minute video
3. **User Satisfaction**: 4.5+ star rating on director notes quality
4. **Engagement Improvement**: 30%+ improvement in user video metrics after applying suggestions
5. **Adoption Rate**: 70%+ of users use Director Mode on uploaded videos

---

## Technical Constraints

1. OpenAI GPT-4 Vision for visual analysis
2. OpenAI Whisper for audio transcription
3. Custom ML models for voice tone analysis
4. MediaPipe or similar for gesture/pose detection
5. FFmpeg for video processing
6. Maximum video size: 100MB
7. Maximum video length: 10 minutes
8. Supported formats: MP4, MOV, AVI

---

## Future Enhancements

1. Real-time analysis during recording
2. Live coaching mode with instant feedback
3. A/B testing different delivery styles
4. Industry-specific templates (real estate, education, sales)
5. Multi-language support
6. Voice cloning for script testing
7. Automated video editing based on director notes
