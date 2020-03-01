import * as React from "react";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "isomorphic-unfetch";
import { NextPageContext } from "next";
import axios from "axios";

type Props = {
  user: any;
  messages: any;
};

type State = {
  user: any;
  messages: any;
  value: string;
};

export default class Index extends React.Component<Props, State> {
  static async getInitialProps({ req, query }: NextPageContext) {
    // @ts-ignore
    const user = req && req.session ? req.session.decodedToken : null;

    const messages = null;
    return { user, messages };
  }

  constructor(props: any) {
    super(props);
    this.state = {
      user: this.props.user,
      value: "",
      messages: this.props.messages
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.apiPublic = this.apiPublic.bind(this);
    this.apiPrivate = this.apiPrivate.bind(this);
  }

  componentDidMount() {
    firebase.initializeApp({
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_PUBLIC_API_KEY
    });

    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        this.setState({ user: user });
        return user.getIdToken().then(token => {
          return fetch("api/login", {
            method: "POST",
            headers: new Headers({ "Content-Type": "application/json" }),
            credentials: "same-origin",
            body: JSON.stringify({ token })
          });
        });
      } else {
        this.setState({ user: null });
        fetch("/api/logout", {
          method: "POST",
          credentials: "same-origin"
        });
      }
    });
  }

  async apiPublic() {
    let res = await axios.get("http://localhost:8000/public");
    console.log(res.data);
  }

  async apiPrivate() {
    if (this.state.user) {
      const token = await this.state.user.getIdToken();
      let res = await axios.get("http://localhost:8000/private", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(res.data);
    }
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    this.setState({ value: "" });
    console.log("submit");
  }

  handleLogin() {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  handleLogout() {
    firebase.auth().signOut();
  }

  render() {
    const { user, value, messages } = this.state;

    return (
      <div>
        {user ? (
          <button onClick={this.handleLogout}>Logout</button>
        ) : (
          <button onClick={this.handleLogin}>Login</button>
        )}
        {user && (
          <div>
            <form onSubmit={this.handleSubmit}>
              <input
                type={"text"}
                onChange={this.handleChange}
                placeholder={"add message..."}
                value={value}
              />
            </form>
            <ul>
              {messages &&
                Object.keys(messages).map((key: any) => (
                  <li key={key}>{messages[key].text}</li>
                ))}
            </ul>
          </div>
        )}
        <button onClick={this.apiPrivate}>private</button>
        <button onClick={this.apiPublic}>public</button>
      </div>
    );
  }
}
