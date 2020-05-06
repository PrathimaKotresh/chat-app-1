import React, { Component } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { GiftedChat, Bubble } from "react-native-gifted-chat";
// Keyboard Spacer for Android
import KeyboardSpacer from "react-native-keyboard-spacer";
const firebase = require("firebase");
require("firebase/firestore");

export default class Chat extends Component {
  constructor() {
    super();
    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyAAD4AKdA77lwM5-K72k7eCglp3OsjWOqk",
        authDomain: "chattington-a5567.firebaseapp.com",
        databaseURL: "https://chattington-a5567.firebaseio.com",
        projectId: "chattington-a5567",
        storageBucket: "chattington-a5567.appspot.com",
        messagingSenderId: "700350872056",
        appId: "1:700350872056:web:f11855f421d52679083e0d"
      });
    }
    this.referenceMessages = firebase.firestore().collection("messages");

    this.state = {
      messages: [],
      user: {
        _id: "",
        name: "",
        avatar: ""
      },
      uid: 0
    };
  }
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.name
    };
  };
  async getMessages() {
    let messages = "";
    try {
      messages = (await AsyncStorage.getItem("messages")) || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  }
  async saveMessages() {
    try {
      await AsyncStorage.setItem(
        "messages",
        JSON.stringify(this.state.messages)
      );
    } catch (error) {
      console.log(error.message);
    }
  }

  async deleteMessages() {
    try {
      await AsyncStorage.removeItem("messages");
    } catch (error) {
      console.log(error.message);
    }
  }
  componentDidMount() {
    this.getMessages();
    this.authUnsubscribe = firebase.auth().onAuthStateChanged(async user => {
      if (!user) {
        user = await firebase.auth().signInAnonymously();
      }
      this.setState({
        uid: user.uid,
        loggedInText: "Hello there"
      });
      this.unsubscribe = this.referenceMessages.onSnapshot(
        this.onCollectionUpdate
      );
    });
    this.setState({
      messages: []
    });
  }

  componentWillUnmount() {
    this.authUnsubscribe();
  }
  onCollectionUpdate = querySnapshot => {
    const messages = [];
    querySnapshot.forEach(doc => {
      var data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text.toString(),
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar
        }
      });
    });
    this.setState({
      messages
    });
  };

  addMessages() {
    this.referenceMessages.add({
      _id: this.state.messages[0]._id,
      text: this.state.messages[0].text,
      createdAt: this.state.messages[0].createdAt,
      user: this.state.messages[0].user,
      uid: this.state.uid
    });
  }

  onSend(messages = []) {
    this.setState(
      previousState => ({
        messages: GiftedChat.append(previousState.messages, messages)
      }),
      () => {
        this.addMessages();
        this.saveMessages();
      }
    );
  }

  renderBubble(props) {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#444"
          }
        }}
      />
    );
  }

  //  This adds the users name to the header
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.state.params.name
    };
  };
  render() {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: this.props.navigation.state.params.selectedColor
          }
        ]}>
        <Text style={styles.userName}>
          {this.props.navigation.state.params.name} in da houz
        </Text>

        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}
          onSend={messages => this.onSend(messages)}
          user={{
            _id: 1
          }}
        />
        {Platform.OS === "android" ? <KeyboardSpacer /> : null}
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  userName: {
    fontSize: 10,
    color: "#fff",
    alignSelf: "center",
    opacity: 0.5,
    marginTop: 25
  }
});
