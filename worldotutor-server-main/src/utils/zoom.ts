import axios from "axios";
import { areIntervalsOverlapping } from "date-fns";
const KJUR = require('jsrsasign')

async function authZoom() {
  //generate a new access token
  var config = {
    method: "post",
    url: "https://zoom.us/oauth/token",
    headers: {
      Authorization: "Basic " + process.env.ZOOM_BASE64_ENCODED,
    },
    params: {
      grant_type: "account_credentials",
      account_id: process.env.ZOOM_ACCOUNTID,
    },
  };
  return await axios(config)
    .then(async function (response) {
      return response.data.access_token;
    })
    .catch(err => console.log(err))
}


export async function getUsers() {
  const token = await authZoom();
  try {
    var config2 = {
      method: "get",
      url: "https://api.zoom.us/v2/users?page_size=120&role_id=2",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    };
    return await axios(config2)
      .then(function (response) {
        const users = response.data.users;
        return users.map((user: any) => user.id);
      })
      .catch(function (error) {
        console.log(error.data);
      });
  } catch (err) {
    console.log(err);
  }
}

export async function getZoomUserIdToCreateMeet(time: string): Promise<string> {
  const users = await getUsers();
  const zoomUserId = users[Math.floor(Math.random() * users.length)];
  const result = await checkUserMeetingExistsAtDate(zoomUserId, time);
  console.log(result);
  if (result) {
    return getZoomUserIdToCreateMeet(time);
  } else {
    return zoomUserId;
  }
}

export async function checkUserMeetingExistsAtDate(zoomUserId: string, time: string) {
  const token = await authZoom();
  try {
    var config = {
      method: "get",
      url: `https://api.zoom.us/v2/users/${zoomUserId}/meetings?type=upcoming`,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    };
    return await axios(config)
      .then(function (response) {
        if (response.data.status == "OK") {
          let meetings = response.data.data.meetings;
          for (const meeting of meetings) {
            let meetStart = meeting.start_time;
            let meetEnd = new Date(new Date(meeting.start_time).getTime() + (1000 * 60 * 60));
            let start = new Date(time);
            let end = new Date(new Date(time).getTime() + (1000 * 60 * 60));
            return areIntervalsOverlapping({ start: meetStart, end: meetEnd }, { start: start, end: end })
          }
        } else {
          return false
        }
      })
      .catch(function (error) {
        console.log(error.data);
      });
  } catch (err) {
    console.log(err);
  }

}


export async function generateMeet(zoomUserId: string, tutorEmail: string, scheduledTime: any, meta: { agenda: string, topic: string }) {
  var meeting_data = JSON.stringify({
    agenda: meta.agenda,
    default_password: false,
    duration: 60,
    pre_schedule: false,
    schedule_for: zoomUserId,
    start_time: scheduledTime.start,
    type: 2,
    topic: meta.topic,
    settings: {
      contact_email: "",
      contact_name: "dev",
      email_notification: true,
      focus_mode: true,
      host_video: true,
      jbh_time: 10,
      join_before_host: true,
      alternative_hosts_email_notification: true,
      authentication_exception: [
        { email: "webstar606@gmail.com", name: "tester" }
      ],
      meeting_authentication: true,
      meeting_invitees: [
        {
          email: "",
        },
      ],
      mute_upon_entry: false,
      participant_video: false,
      private_meeting: false,
      registrants_confirmation_email: true,
      registrants_email_notification: true,
      registration_type: 1,
      show_share_button: true,
      use_pmi: false,
      waiting_room: false,
      watermark: false,
      host_save_video_order: true,
      alternative_host_update_polls: true,
    },

  });

  const token = await authZoom();

  try {
    var config2 = {
      method: "post",
      url: `https://api.zoom.us/v2/users/${zoomUserId}/meetings`,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      data: meeting_data,
    };
    console.log(config2)
    // console.log("Access Token" + response.data.access_token);

    //generate a meeting url.
    return await axios(config2)
      .then(function (response) {
        console.log(response.data);;
        return response.data
      })
      .catch(function (error) {
        console.log(error);
      });

  } catch (err) {
    console.log(err);
  }

}


export async function generateSignature(meetingId: number, role: number) {
  const iat = Math.round(new Date().getTime() / 1000) - 30;
  const exp = iat + 60 * 60 * 2

  const oHeader = { alg: 'HS256', typ: 'JWT' }

  const oPayload = {
    "appKey": process.env.ZOOM_SDK_CLIENTID,
    "sdkKey": process.env.ZOOM_SDK_CLIENTID,
    "mn": meetingId,
    "role": role,
    "iat": iat,
    "exp": exp,
    "tokenExp": iat + 60 * 60 * 2
  }

  const sHeader = JSON.stringify(oHeader)
  const sPayload = JSON.stringify(oPayload)
  const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_SDK_CLIENTSECRET)
  return signature
}


export async function getZakToken(hostId: string) {
  const token = await authZoom();
  try {
    var config2 = {
      method: "get",
      url: `https://api.zoom.us/v2/users/${hostId}/token?type=zak`,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
    };
    return await axios(config2)
      .then(function (response) {
        return response.data
      })
      .catch(function (error) {
        console.log(error);
      });

  } catch (err) {
    console.log(err);
  }
}

export async function endMeeting(meetingId: number) {
  const token = await authZoom();
  var config = {
    method: "put",
    url: `https://api.zoom.us/v2/meetings/${meetingId}/status`,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    data: JSON.stringify({
      action: "end"
    })
  };
  try {
    return await axios(config)
      .then(function (response) {
        return response.data
      })
      .catch(function (error) {
        console.log("err", error.data);
      });
  } catch (err) {
    console.log("error", err);

  }
}