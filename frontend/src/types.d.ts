type Message = {
    type: "offer" | "answer" | "offer candidate" | "answer candidate",
    data: Offer | Answer | OfferCandidate | AnswerCandidate
}

type Offer = {
    sdp: string,
    type: RTCSdpType
}

type Answer = {
    sdp: string,
    type: RTCSdpType
}

type OfferCandidate = {
    candidate?: string;
    sdpMLineIndex?: number | null;
    sdpMid?: string | null;
    usernameFragment?: string | null;
}

type AnswerCandidate = {
    candidate?: string;
    sdpMLineIndex?: number | null;
    sdpMid?: string | null;
    usernameFragment?: string | null;
}