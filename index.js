import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View, Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import { styles, radius } from './styles.js';

export default class Ripple extends PureComponent {
  static defaultProps = {
    rippleColor: 'rgb(0, 0, 0)',
    rippleOpacity: 0.30,
    rippleDuration: 400,
    rippleSize: 0,
    rippleContainerBorderRadius: 0,
    rippleCentered: false,
    rippleSequential: false,
    disabled: false,
  };

  static propTypes = {
    ...Animated.View.propTypes,
    rippleColor: PropTypes.string,
    rippleOpacity: PropTypes.number,
    rippleDuration: PropTypes.number,
    rippleSize: PropTypes.number,
    rippleContainerBorderRadius: PropTypes.number,
    rippleCentered: PropTypes.bool,
    rippleSequential: PropTypes.bool,
    disabled: PropTypes.bool,
  };

  constructor(props) {
    super(props);

    this.onLayout = this.onLayout.bind(this);
    this.renderRipple = this.renderRipple.bind(this);

    this.unique = 0;
    this.mounted = false;

    this.state = {
      width: 0,
      height: 0,
      ripples: [],
    };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  onLayout(event) {
    let { width, height } = event.nativeEvent.layout;
    let { onLayout } = this.props;

    if ('function' === typeof onLayout) {
      onLayout(event);
    }

    this.setState({ width, height });
  }

   _parsePosition(pos){
      switch(pos){
         case "center":
            return {locationX: 0.5 * this.state.width, locationY: 0.5 * this.state.height}
         case "bottomLeft":
            return {locationX: 0, locationY: this.state.height}
         case "bottomRight":
            return {locationX: this.state.width, locationY: this.state.height}
         case "topLeft":
            return {locationX: 0, locationY: this.state.height}
         case "topRight":
            return {locationX: this.state.width, locationY: 0}
      }
   }

  startRipple(position) {
    let { rippleDuration, rippleCentered, rippleSize } = this.props;
    let { width, height } = this.state;

    let w2 = 0.5 * width;
    let h2 = 0.5 * height;

    let { locationX, locationY } = this._parsePosition(position);

    let offsetX = Math.abs(w2 - locationX);
    let offsetY = Math.abs(h2 - locationY);

    let R = rippleSize > 0?
      0.5 * rippleSize:
      Math.sqrt(Math.pow(w2 + offsetX, 2) + Math.pow(h2 + offsetY, 2));

    let ripple = {
      unique: this.unique++,
      progress: new Animated.Value(0),
      locationX,
      locationY,
      R,
    };

    Animated
      .timing(ripple.progress, {
        toValue: 1,
        easing: Easing.out(Easing.ease),
        duration: rippleDuration,
        useNativeDriver: true,
      })
      .start(() => {
        if (this.mounted) {
          this.setState(({ ripples }) => ({ ripples: ripples.slice(1) }));
        }
      });

    this.setState(({ ripples }) => ({ ripples: ripples.concat(ripple) }));
  }

  renderRipple({ unique, progress, locationX, locationY, R }) {
    let { rippleColor, rippleOpacity } = this.props;

    let rippleStyle = {
      top: locationY - radius,
      left: locationX - radius,
      backgroundColor: rippleColor,

      transform: [{
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5 / radius, R / radius],
        }),
      }],

      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [rippleOpacity, 0],
      }),
    };

    return (
      <Animated.View style={[styles.ripple, rippleStyle]} key={unique} />
    );
  }

  render() {
    let { ripples } = this.state;
    let { onLayout } = this;
    let {
      disabled,
      children,
      rippleContainerBorderRadius,
      onLayout: __ignored__,
      ...props
    } = this.props;

    let touchableProps = {
      disabled, 
      onLayout,
    };

    let containerStyle = {
      borderRadius: rippleContainerBorderRadius,
    };

    return (
        <Animated.View {...props} pointerEvents='box-only' onLayout={onLayout} >
         <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5}}>
            {children}
         </View>

          <View style={[styles.container, containerStyle]}>
            {ripples.map(this.renderRipple)}
          </View>
        </Animated.View>
    );
  }
}
