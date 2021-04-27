/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
export interface BotResponse {
    sessionId: string,
    sessionPath?: string,
    projectId: string,
    agentId?: string,
    location?: string,
    platform?: string,
    languageCode: string,
    dateTimeStamp: number,
    query?: string,
    text?: string,
    fulfillmentText?: string,
    sentiment?: {
        score: number,
        magnitude: number
    },
    intentDetection?: {
        intent: {
            displayName: string,
            name: string,
            parameters: Array<string>,
            priority: number,
            trainingPhrases: Array<string>,
            isFallback: boolean,
            isEndInteraction?: boolean,
            intentDetectionConfidence: number

            events?: any,
            isLiveAgent?: boolean,
            inputContextNames?: any,
            outputContexts?: any,
            resetContexts?: any,
            rootFollowupIntentName?: string,
            parentFollowupIntentName?: string,
            followupIntentInfo?: any,
        }
    },
    action?: string,
    currentPage?: {
        displayName: string,
        entryFulfillment?: any,
        eventHandlers?: any,
        form?: any,
        name: string,
        transitionRouteGroups?: any,
        transitionRoutes?: any
    },
    responseMessages?: Array<ResponseMessages>,
    outputAudio?: any,
    webhookPayloads?: any,
    webhookStatuses?: any,
    webhookSource?: any,
    responseId?: string,
    error?: any
}

export interface ResponseMessages {
    message?: string,
    text?: {
        allowPlaybackInterruption: boolean
        text: Array<string>
    }
}