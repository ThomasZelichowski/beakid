import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;  // API key from .env file

// Constants
const MAX_STEPS = 10; 
const SPEECH_LANG = 'en-US';
const openaiUrl = 'https://api.openai.com/v1/chat/completions';

// Speech recognition availability check
const isSpeechRecognitionAvailable = () => {
  return ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
};

// Speech recognition error handler
const handleSpeechError = (event) => {
  console.error('Error occurred in speech recognition:', event.error);
};

function App() {
  const [childrenResponses, setChildrenResponses] = useState(Array(MAX_STEPS).fill('')); 
  const [response, setResponse] = useState('');
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [hasResponded, setHasResponded] = useState(false);
  const [complete, setComplete] = useState(false);
  const [realTimeSpeech, setRealTimeSpeech] = useState('');
  const [aiOutput, setAiOutput] = useState('');

  useEffect(() => {
    if (isSpeechRecognitionAvailable()) {
      const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const speech = new recognition();
      speech.continuous = true;
      speech.lang = SPEECH_LANG;
      speech.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
      };
      speech.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
      };
      speech.onerror = handleSpeechError;
      speech.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        console.log('Speech input: ', transcript);
        setRealTimeSpeech(transcript);
        handleSpeechInput(transcript);
      };
      setSpeechRecognition(speech);
    } else {
      console.log('Speech Recognition is not supported in this browser');
    }
  }, []);

  const startListening = () => {
    if (!isListening && speechRecognition) {
      speechRecognition.start();
    }
  };

  const stopListening = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  const handleSpeechInput = (input) => {
    const trimmedInput = input.trim().toLowerCase();
    console.log('Received speech input:', trimmedInput);
    setResponse(input);
    setInput(input);
    setHasResponded(true);
  };

  const handleDecision = (decision) => {
    if (decision === 'continue') {
      stopListening();
      setStep((prevStep) => prevStep + 1); 
      setHasResponded(false); 
      setRealTimeSpeech(''); 
      setResponse(''); 
      if (step === MAX_STEPS - 1) { 
        setComplete(true); 
      }

      setChildrenResponses((prevResponses) => {
        const updatedResponses = [...prevResponses]; 
        updatedResponses[step] = response; 
        return updatedResponses;
      });

    } else if (decision === 'redo') {
      stopListening();
      setHasResponded(false);
      setResponse('');
      setRealTimeSpeech('');

      setChildrenResponses((prevResponses) => { 
        const updatedResponses = [...prevResponses];
        updatedResponses[step] = ''; 
        return updatedResponses;
      });
    }
  };

  const handleChange = (event) => {
    setResponse(event.target.value);
  };

  const compileResponses = () => {
    return childrenResponses.map((response, index) => (
      <li key={index}>
        Response {index + 1}: {response} 
      </li>
    ));
  };

  const profile = async () => {
    try {
      const requestData = {
        "model": "gpt-3.5-turbo", 
        "messages": [
          {"role": "system", "content": "You are an AI assistant that helps users create a profile based on information about their children."},
          {"role": "user", "content": `Create a profile based on the following information about a user's children:\n\n${childrenResponses.join('\n')} Use this format: Kids Names
          Kids Ages
          Kids interests
          Kids difficulties
          Family financial status
          Weekend Active Level (Active, Passive, Home)
          Extracurricular load (Light, Medium, Heavy)
          Skill Development Considerations
          `} 
        ]
      };

      const result = await axios.post(openaiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`, // Use the API key from .env
        },
      });

      setAiOutput(result.data.choices[0].message.content); 

    } catch (error) {
      console.error('Error fetching AI response:', error);
      setAiOutput('An error occurred while fetching the response.');
    }
  };

  return (
    <div className="App">
      <h1>Welcome!</h1>
      {step < MAX_STEPS ? (
        <div>
          {/* Dynamic Step Logic */}
          {step === 0 && (
            <div>
              <h4>Can you tell us about your children?</h4>
              <p>Let’s start with their names and ages. Just speak naturally.</p>
              <button onClick={startListening}>Start Listening</button>
              {hasResponded && (
                <div>
                  <button onClick={() => handleDecision('continue')}>Continue</button>
                  <button onClick={() => handleDecision('redo')}>Redo</button>
                </div>
              )}
            </div>
          )}
            {step === 1 && (
            <div>
              <h4>For each of your kids, what activities do they enjoy most this year?</h4>
              <p>Please name each child and share their favorite hobbies or interests, whether it’s soccer, painting, math, or something else. Feel free to include any stories or specific details.</p>
              <button onClick={startListening}>Start Listening</button>
              {hasResponded && (
                <div>
                  <button onClick={() => handleDecision('continue')}>Continue</button>
                  <button onClick={() => handleDecision('redo')}>Redo</button>
                </div>
              )}
            </div>
          )}
          {step === 2 && (
            <div>
              <h4>What challenges are your children facing this year?</h4>
              <p>For each child, start with their name and talk about any struggles they’ve encountered—whether it’s school-related, like difficulty with a subject, or something broader like focusing or managing emotions. Feel free to share specific examples.</p>
              <button onClick={startListening}>Start Listening</button>
              {hasResponded && (
                <div>
                  <button onClick={() => handleDecision('continue')}>Continue</button>
                  <button onClick={() => handleDecision('redo')}>Redo</button>
                </div>
              )}
            </div>
            )}
            {step === 3 && (
              <div>
                <h4>What afterschool programs are your children involved in, and how do you approach managing their schedules?</h4>
                <p>We’d love to hear about their extracurricular activities and how you balance them. For example, you might say, "John is in three different activities, but I’m considering scaling back so he doesn’t feel overwhelmed."</p>
                <button onClick={startListening}>Start Listening</button>
                {hasResponded && (
                  <div>
                    <button onClick={() => handleDecision('continue')}>Continue</button>
                    <button onClick={() => handleDecision('redo')}>Redo</button>
                  </div>
                )}
              </div>
            )}
            {step === 4 && (
              <div>
                <h4>What kind of parent are you when it comes to extracurriculars?</h4>
                <p>Describe your parenting style in relation to your children's activities. Do you encourage them to explore freely, or are you more structured and selective about what they do?</p>
                <button onClick={startListening}>Start Listening</button>
                {hasResponded && (
                  <div>
                    <button onClick={() => handleDecision('continue')}>Continue</button>
                    <button onClick={() => handleDecision('redo')}>Redo</button>
                  </div>
                )}
              </div>
            )}
            {step === 5 && (
              <div>
                <h4>What are your family’s weekend routines or traditions?</h4>
                <p>Share how your family usually spends the weekends. Are there any favorite activities or places you love to visit? We’d love to know what makes your weekends special.</p>
                <button onClick={startListening}>Start Listening</button>
                {hasResponded && (
                  <div>
                    <button onClick={() => handleDecision('continue')}>Continue</button>
                    <button onClick={() => handleDecision('redo')}>Redo</button>
                  </div>
                )}
                </div>
          )}
          {step === 6 && (
            <div>
              <h4>What type of activities do you, as a parent, prefer for your kids?</h4>
              <p>Do you prefer structured activities like sports or classes, or do you value free play and exploration? Let us know what you think is most important for your child's growth and well-being.</p>
              <button onClick={startListening}>Start Listening</button>
              {hasResponded && (
                <div>
                  <button onClick={() => handleDecision('continue')}>Continue</button>
                  <button onClick={() => handleDecision('redo')}>Redo</button>
                </div>
              )}
            </div>
          )}
          {step === 7 && (
            <div>
              <h4>Are there any particular skills or interests you’d like your children to develop?</h4>
              <p>Whether it's learning a new language, developing athletic skills, or fostering a love for the arts, tell us what you'd love to see your children explore and grow in.</p>
              <button onClick={startListening}>Start Listening</button>
              {hasResponded && (
                <div>
                  <button onClick={() => handleDecision('continue')}>Continue</button>
                  <button onClick={() => handleDecision('redo')}>Redo</button>
                </div>
              )}
              </div>
        )}
        {step === 8 && (
          <div>
            <h4>For each of your kids, what activities do they enjoy most this year?</h4>
            <p>Please name each child and share their favorite hobbies or interests, whether it’s soccer, painting, math, or something else. Feel free to include any stories or specific details.</p>
            <button onClick={startListening}>Start Listening</button>
            {hasResponded && (
              <div>
                <button onClick={() => handleDecision('continue')}>Continue</button>
                <button onClick={() => handleDecision('redo')}>Redo</button>
              </div>
            )}
          </div>
        )}
        {step === 9 && (
          <div>
            <h4>What are your family’s goals or priorities for your kids’ development this year?</h4>
            <p>Every family has unique priorities. Whether it’s academic improvement, building social skills, or encouraging creativity, we’d love to hear what’s important to you for your kids this year.</p>
            <button onClick={startListening}>Start Listening</button>
            {hasResponded && (
              <div>
                <button onClick={() => handleDecision('continue')}>Continue</button>
                <button onClick={() => handleDecision('redo')}>Redo</button>
              </div>
            )}
            </div>
      )}
          {step === 10 && (
            <div>
              <h4>How do your kids typically react to new activities?</h4>
              <p>Are they adventurous and eager to try new things, or do they take time to warm up to unfamiliar experiences? This will help us understand how to suggest activities that match their personalities.</p>
              <button onClick={startListening}>Start Listening</button>
              {hasResponded && (
                <div>
                  <button onClick={() => handleDecision('continue')}>Continue</button>
                  <button onClick={() => handleDecision('redo')}>Redo</button>
                </div>
              )}
            </div>
          )}
    
        </div>
      ) : (
        <div>
          <p>Goodbye! Thank you for sharing all the details about your children!</p>
        </div>
      )}

      <div>
        <h3>Current Input:</h3>
        <p>{realTimeSpeech}</p>
      </div>

      <div>
        <h3>Full Response:</h3>
        <input type="text" value={response} onChange={handleChange} />
        <p>{response}</p>
      </div>

      <div>
        <h3>Responses so far:</h3>
        <ul>
          {compileResponses()}
        </ul>
      </div>

      <div>
        <h3>Profile</h3>
        {complete ? (
          <>
            <p>{aiOutput}</p>
            <button onClick={profile}>Generate Profile</button> 
          </>
        ) : (
          <p>Please answer all the questions</p>
        )}
      </div>
    </div>
  );
}

export default App;
