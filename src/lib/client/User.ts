import { Models } from "../../models/proto/models";
import { Packets } from "../../models/proto/packets";

export class PlayerWithScore extends Models.User {
    score_details: Packets.Push.RealtimeScore;

    constructor(player: Models.User) {
        super(player);
        this.score_details = Packets.Push.RealtimeScore.fromObject(this._baseScoreDetails);
    }

    updateUser(user: Models.User) {
        if (this.play_state === Models.User.PlayStates.Waiting && user.play_state === Models.User.PlayStates.InGame) {
            this.resetScoreDetails();
        }
        this.guid = user.guid;
        this.name = user.name;
        this.user_id = user.user_id;
        this.client_type = user.client_type;
        this.team = user.team;
        this.play_state = user.play_state;
        this.download_state = user.download_state;
        this.mod_list = user.mod_list;
        this.stream_screen_coordinates = user.stream_screen_coordinates;
        this.stream_delay_ms = user.stream_delay_ms;
        this.stream_sync_start_ms = user.stream_sync_start_ms;
    }

    updateScore(score: Packets.Push.RealtimeScore) {
        this.score_details = score;
    }

    resetScoreDetails() {
        this.score_details = Packets.Push.RealtimeScore.fromObject(this._baseScoreDetails);
    }

    get _baseScoreDetails() {
        const details = new Packets.Push.RealtimeScore();
        details.scoreTracker = new Models.ScoreTracker();
        details.scoreTracker.leftHand = new Models.ScoreTrackerHand();
        details.scoreTracker.rightHand = new Models.ScoreTrackerHand();
        details.scoreTracker.leftHand.avgCut = [0, 0, 0];
        details.scoreTracker.rightHand.avgCut = [0, 0, 0];
        return details.toObject();
    }

    get userOnly() {
        return new Models.User(this);
    }
}
