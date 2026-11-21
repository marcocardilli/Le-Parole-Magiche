import AVFoundation
import SwiftUI
import WebKit

@main
struct BeaApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .background(Color(red: 1, green: 0.976, blue: 0.925))
        }
    }
}

struct GameView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(context.coordinator, name: "beaSpeech")
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.bounces = false

        if let page = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Game") {
            view.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        }
        return view
    }

    func updateUIView(_ view: WKWebView, context: Context) {
        // The web view manages its own game state after loading.
    }

    static func dismantleUIView(_ view: WKWebView, coordinator: Coordinator) {
        view.configuration.userContentController.removeScriptMessageHandler(forName: "beaSpeech")
        coordinator.speech.stopSpeaking(at: .immediate)
    }

    final class Coordinator: NSObject, WKScriptMessageHandler {
        let speech = AVSpeechSynthesizer()

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.frameInfo.isMainFrame else { return }
            speech.stopSpeaking(at: .immediate)
            let letter = message.body as? [String: String]
            guard let text = letter?["text"] ?? message.body as? String, !text.isEmpty else { return }

            let italian = AVSpeechSynthesisVoice.speechVoices().filter { $0.language == "it-IT" }
            let utterance: AVSpeechUtterance
            if let phoneme = letter?["phoneme"] {
                let ipaKey = NSAttributedString.Key(rawValue: AVSpeechSynthesisIPANotationAttribute)
                let pronunciation = NSAttributedString(string: text, attributes: [ipaKey: phoneme])
                utterance = AVSpeechUtterance(attributedString: pronunciation)
            } else {
                utterance = AVSpeechUtterance(string: text)
            }
            utterance.voice = italian.filter { $0.gender == .female }.max {
                $0.quality.rawValue < $1.quality.rawValue
            } ?? AVSpeechSynthesisVoice(language: "it-IT")
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.82
            utterance.pitchMultiplier = letter == nil ? 1.12 : 1.06
            speech.speak(utterance)
        }
    }
}
