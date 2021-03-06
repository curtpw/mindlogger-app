
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {reduxForm, Field, formValueSelector, FieldArray, submit, reset} from 'redux-form';
import { Container, Header, Title, Content, Button, Item, Label, Input, Body, Left, Right, Icon, Form, Text, Segment, Radio, View, Row, Subtitle, H1, Thumbnail, ListItem } from 'native-base';
import { Actions } from 'react-native-router-flux';
import {updateSurvey} from '../../actions'
import {FormInputItem, FormSwitchItem, FormRadioButtonGroup} from '../../../../components/form/FormItem'
import {fbAddActivity, fbUpdateActivity} from '../../../../firebase'
import ImageBrowser from '../../../../components/image/ImageBrowser'

const questionInitialState = {
  type: "text",
  rows: [],
  images: [],
}
class SurveyEditQuestionForm extends Component {

    constructor(props) {
      super(props)
    }

    componentWillMount() {
        this.setState({imageSelect: false})
    }

    renderRows = ({fields, meta: {error, submitFailed}}) => {
      return (<View padder>
          {fields.map((member,index) => (
            <Row key={index}><Field itemStyle={{flex:1}} inlineLabel label={`Choice ${index+1}`} name={`${member}.text`} type="text" component={FormInputItem}/><Button transparent onPress={() => fields.remove(index) }><Icon name="trash" style={{color: 'red'}}/></Button></Row>
          ))}
          <Row padder><Right><Button onPress={()=> fields.push({text:'', value:fields.length})}><Text>Add choice</Text></Button></Right></Row>
        </View>)
    }

    

    renderImageRows = ({fields, meta: {error, submitFailed}}) => {
        let images = fields.getAll() || []
        return (<View padder>
            {images.map((item,index) => (
                <ListItem key={index}>
                    <Left>
                        <Thumbnail square source={{uri: item.image_url}} />
                    </Left>
                    <Body>
                        <Text>{item.name}</Text>
                    </Body>
                    <Right>
                        <Button transparent onPress={() => fields.remove(index) }><Icon name="trash" style={{color: 'red'}}/></Button>
                    </Right>
                </ListItem>
            ))}
            <Row padder><Right><Button onPress={()=> this.showImageBrowser(fields)}><Text>Add choice</Text></Button></Right></Row>
          </View>)
    }

    renderExtraFields(question_type) {
        switch(question_type) {
            case 'single_sel':
            case 'multi_sel':
                return (<FieldArray name="rows" component={this.renderRows}/>)
            case 'image_sel':
                return (<FieldArray name="images" component={this.renderImageRows} value={this.state.images || []}/>)
            default:
                return false
        }
    }

    showImageBrowser(fields) {
        this.imageFields = fields
        this.setState({imageSelect:true})
    }

    onSelectImage = (item, imagePath) => {
        if(item) {
            this.imageFields.push(item)   
        }
        this.setState({imagePath, imageSelect:false})
        
    }


    render() {
      console.log("form:", this.props)
      const { handleSubmit, onSubmit, submitting, reset } = this.props;
      let question_type = this.props.question_type || (this.props.initialValues && this.props.initialValues.type)
      return (
          <Form>
          <Field name="title" floatingLabel type="text" placeholder="Add a question" component={FormInputItem} />
          <Field name="type"
            component ={FormRadioButtonGroup}
            placeholder = "Question Type"
            options   ={[
              {text:"Text",value:"text"},
              {text:"Choice",value:"single_sel"},
              {text:"Multiple",value:"multi_sel"},
              {text:"Image", value:"image_sel"}
            ]} />
            { this.renderExtraFields(question_type) }
            { this.state.imageSelect && <ImageBrowser path={this.state.imagePath} onSelectImage={this.onSelectImage}/> }
          </Form>)
    }
}

SurveyEditQuestionReduxForm = reduxForm({
    form: 'survey-edit-question',
    enableReinitialize: true,
    destroyOnUnmount: false,
    forceUnregisterOnUnmount: true
})(SurveyEditQuestionForm)

const selector = formValueSelector('survey-edit-question')
SurveyEditQuestionValueForm = connect(
  state => {
    let {type, images} = selector(state, 'type', 'images')
    return {question_type: type, images}
  }
)(SurveyEditQuestionReduxForm)

class SurveyBasicEditQuestionScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
        mode: 1,
        };
    }

    pushRoute(route) {
        Actions.push(route)
    }

    popRoute() {
        Actions.pop()
    }

    updateQuestion = (body) => {
        let {surveyIdx, questionIdx, surveys, user} = this.props
        if(surveyIdx < 0) {
            surveyIdx = surveys.length + surveyIdx
        }
        console.log(surveyIdx)
        let survey = surveys[surveyIdx]
        let questions = survey.questions || []
        if(questions.length>questionIdx) {
            questions[questionIdx] = body
        } else {
            questions.push(body)
        }
        survey.questions = questions
		this.props.updateSurvey(surveyIdx, survey)
		if(this.isNext) {
			questionIdx = questionIdx + 1
			Actions.replace("survey_basic_edit_question",{surveyIdx, questionIdx})
		} else {
            if(user.role == 'clinician') {
                fbUpdateActivity('surveys', survey).then(result => {
                    Actions.pop()
                })
            } else {
                Actions.pop()
            }
            
		}
		
    }

    updateAndNext() {
        this.isNext=true
        this.props.submitForm()
    }
    updateAndDone() {
		this.isNext=false
        this.props.submitForm()
    }
    deleteQuestion() {
        let {surveyIdx, questionIdx, surveys} = this.props
        if(surveyIdx < 0) {
        	surveyIdx = surveys.length + surveyIdx
        }
        let survey = surveys[surveyIdx]
        let questions = survey.questions || []
        if(questions.length>questionIdx) {
			questions.splice(questionIdx,1)
			this.props.updateSurvey(surveyIdx, survey)
        }
        survey.questions = questions
        questionIdx = questionIdx - 1
        Actions.replace("survey_basic_edit_question",{surveyIdx, questionIdx})
    }

    componentWillMount() {
        let {surveyIdx, questionIdx, surveys} = this.props
        if(surveyIdx < 0) {
        surveyIdx = surveys.length + surveyIdx
        }
        const survey = surveys[surveyIdx]
        let question = questionInitialState
        if(questionIdx<survey.questions.length) {
            question = survey.questions[questionIdx]
        } else if(questionIdx>0) {
            question = {...questionInitialState, ...survey.questions[questionIdx-1], title: ''}
        }
        this.setState({survey, question, questionIdx})
    }

    render() {
        let {survey, questionIdx, question} = this.state
        return (
        <Container>
            <Header hasSubtitle>
            <Left>
                <Button transparent onPress={() => Actions.pop()}>
                <Icon name="arrow-back" />
                </Button>
            </Left>
            <Body style={{flex:2}}>
                <Title>{survey.title}</Title>
                <Subtitle>Basic {survey.accordion ? "accordion" : "sequential"} survey</Subtitle>
            </Body>
            <Right>
            </Right>
            </Header>
            <Content padder>
                <H1 style={{textAlign:'center'}}>{`Question ${questionIdx+1}`}</H1>
                <SurveyEditQuestionValueForm onSubmit={this.updateQuestion} initialValues={question}/>
                <Row style={{ marginTop: 20 }}>
                    <Button block onPress={() => this.updateAndNext()} style={{ margin: 15, flex:1}}>
                    <Text>Next</Text>
                    </Button>
                    <Button block danger onPress={() => this.deleteQuestion()} style={{ margin: 15, flex:1}}>
                    <Text>Delete</Text>
                    </Button>
                </Row>
                <Button block style={{ marginLeft: 15, marginRight: 15 }} onPress={()=> this.updateAndDone()}><Text>Done</Text></Button>
            </Content>
        </Container>
        );
    }
} 

const mapDispatchToProps = (dispatch) => ({
    updateSurvey: (index, data) => dispatch(updateSurvey(index, data)),
    submitForm: () => {
        dispatch(submit('survey-edit-question'))
    },
    resetForm: () => {
        dispatch(reset('survey-edit-question'))
    },
})

const mapStateToProps = state => ({
  surveys: state.survey.surveys,
  themeState: state.drawer.themeState,
  user: state.core.user
});

export default connect(mapStateToProps, mapDispatchToProps)(SurveyBasicEditQuestionScreen);
